import { publicProcedure, protectedProcedure, router } from "../init";
import { z } from "zod";
import { db, comments, users, posts } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { notifyCommentCreated } from '@/lib/notifications'

export const commentsRouter = router({
  listByPost: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ input }) => {
      const postId = input.postId;
      const rows = await db
        .select({
          id: comments.id,
          content: comments.content,
          creationDate: comments.creationDate,
          userId: comments.userId,
          userName: users.name,
          userImage: users.image,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(desc(comments.creationDate));
      return rows;
    }),

  create: protectedProcedure
    .input(
      z.object({
        postId: z.string(),
        content: z.string().min(1, "Kommentar darf nicht leer sein").max(2000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      const inserted = await db
        .insert(comments)
        .values({ postId: input.postId, userId, content: input.content })
        .returning();

      // determine post author for scoping
      const p = await db.select({ userId: posts.userId }).from(posts).where(eq(posts.id, input.postId)).limit(1)
      const postAuthorId = p[0]?.userId

      // join user data for immediate UI consumption
      const row = await db
        .select({
          id: comments.id,
          content: comments.content,
          creationDate: comments.creationDate,
          userId: comments.userId,
          userName: users.name,
          userImage: users.image,
        })
        .from(comments)
        .leftJoin(users, eq(comments.userId, users.id))
        .where(eq(comments.id, inserted[0].id))
        .limit(1);

      // fire email notifications (safe-guarded)
      if (postAuthorId) {
        try {
          const actorName = ctx.session?.user?.name ?? null
          await notifyCommentCreated({ postId: input.postId, actorId: userId, actorName, postAuthorId })
        } catch (e) {
          console.error('Failed to send comment notifications', e)
        }
      }

      return row[0];
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      // Ensure comment exists and belongs to the current user
      const existing = await db
        .select()
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);

      if (existing.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Kommentar nicht gefunden" });
      }
      if (existing[0].userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Kein Recht zum Löschen" });
      }

      await db.delete(comments).where(eq(comments.id, input.id));
      return { id: input.id } as const;
    }),
});
