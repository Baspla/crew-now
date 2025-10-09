import { protectedProcedure, router } from '../init';
import { z } from 'zod';
import { db, reactions, userReactions, posts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const reactionsRouter = router({
  addToPost: protectedProcedure
    .input(z.object({ postId: z.string(), reactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      // Validate that the referenced userReaction belongs to the current user
      const ur = await db
        .select()
        .from(userReactions)
        .where(and(eq(userReactions.id, input.reactionId), eq(userReactions.userId, userId)))
        .limit(1);
      if (ur.length === 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Reaction does not belong to user' });
      }

      // Optional: ensure post exists
      const p = await db.select().from(posts).where(eq(posts.id, input.postId)).limit(1);
      if (p.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
      }

      // Ensure at most one reaction per user per post: update if exists, insert otherwise.
      const existingAny = await db
        .select()
        .from(reactions)
        .where(and(eq(reactions.postId, input.postId), eq(reactions.userId, userId)))
        .limit(1);

      if (existingAny.length > 0) {
        // If already reacted with same reaction, do nothing (idempotent)
        if (existingAny[0].reactionId === input.reactionId) {
          return { id: existingAny[0].id, created: false } as const;
        }

        // Replace the old reaction with the new one
        await db
          .update(reactions)
          .set({ reactionId: input.reactionId })
          .where(and(eq(reactions.id, existingAny[0].id), eq(reactions.userId, userId)));

        return { id: existingAny[0].id, created: false } as const;
      } else {
        const inserted = await db
          .insert(reactions)
          .values({
            postId: input.postId,
            userId,
            reactionId: input.reactionId,
          })
          .returning();

        return { id: inserted[0].id, created: true } as const;
      }
    }),
});
