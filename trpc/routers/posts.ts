import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { db, posts as postsTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { processAndSave, deleteImage } from "@/lib/image";
import { postsRemainingForUser } from "@/lib/postingRules";
import { notifyNewPost } from "@/lib/notifications";
import crypto from "crypto";

export const postsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid().optional(),
        imageUrl: z.string().min(1, "Back image is required"),
        frontImageUrl: z.string().optional().nullable(),
        caption: z.string().max(160, "Die Bildunterschrift ist zu lang (max. 160 Zeichen).").optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      // Enforce posting rules on the server
      /* Limit temporarily lifted
      const remaining = postsRemainingForUser(userId);
      if (remaining <= 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Du hast dein Posting-Limit für Heute erreicht." });
      }
      */

      if (!input.imageUrl) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Back camera image is required" });
      }

      // Process images
      const savedImageUrl = await processAndSave(input.imageUrl);
      const savedFrontImageUrl = input.frontImageUrl ? await processAndSave(input.frontImageUrl) : null;

      // Idempotent ID handling
      const postId = input.postId ?? crypto.randomUUID();

      try {
        const newPost = await db
          .insert(postsTable)
          .values({
            id: postId,
            imageUrl: savedImageUrl,
            frontImageUrl: savedFrontImageUrl,
            caption: input.caption ?? null,
            userId,
          })
          .returning();

        // Best-effort notification
        try {
          const sessionUserName = ctx.session?.user?.name ?? null;
          await notifyNewPost(newPost[0].id, userId, sessionUserName);
        } catch (e) {
          console.error("Failed to send new-post notifications", e);
        }

        return { id: newPost[0].id, created: true } as const;
      } catch (err: unknown) {
        const isUnique = err instanceof Error && /UNIQUE|PRIMARY KEY/i.test(err.message);
        if (isUnique) {
          // Check existing ownership
          const existing = await db.select().from(postsTable).where(eq(postsTable.id, postId)).all();
          const found = existing?.[0];
          if (found) {
            if (found.userId !== userId) {
              throw new TRPCError({ code: "CONFLICT", message: "Konflikt: Post-ID bereits vergeben." });
            }
            return { id: postId, created: false } as const;
          }
          throw new TRPCError({ code: "CONFLICT", message: "Der Post existiert bereits." });
        }
        throw err;
      }
    }),

  update: protectedProcedure
    .input(z.object({
      postId: z.string().uuid(),
      caption: z.string().max(160, "Die Bildunterschrift ist zu lang (max. 160 Zeichen).").nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      const post = await db.select().from(postsTable).where(eq(postsTable.id, input.postId)).get();

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      if (post.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this post" });
      }

      await db
        .update(postsTable)
        .set({ caption: input.caption })
        .where(eq(postsTable.id, input.postId));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;
      
      const post = await db.select().from(postsTable).where(eq(postsTable.id, input.postId)).get();

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      if (post.userId !== userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this post" });
      }

      // Delete images
      if (post.imageUrl) await deleteImage(post.imageUrl);
      if (post.frontImageUrl) await deleteImage(post.frontImageUrl);

      // Delete post from DB
      await db.delete(postsTable).where(eq(postsTable.id, input.postId));

      return { success: true };
    }),
});
