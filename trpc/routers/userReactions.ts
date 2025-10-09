import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { db, userReactions } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { dataUrlToBuffer } from "@/lib/image";

export const userReactionsRouter = router({
  listMine: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user!.id!;
      const reactions = await db
        .select()
        .from(userReactions)
        .where(eq(userReactions.userId, userId))
        .orderBy(desc(userReactions.id));
      return reactions;
    }),

  upload: protectedProcedure
    .input(z.object({
      imageDataUrl: z.string().min(1, "Bild ist erforderlich"),
      emoji: z.string().min(1, "Emoji ist erforderlich"),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;

      const buf = dataUrlToBuffer(input.imageDataUrl);
      if (!buf) throw new TRPCError({ code: "BAD_REQUEST", message: "Ungültiges Bild" });

      if (buf.length > 5 * 1024 * 1024) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Datei ist zu groß (max 5MB)" });
      }

      const uploadsDir = join(process.cwd(), "uploads", "reactions");
      await mkdir(uploadsDir, { recursive: true });

      const filename = `${crypto.randomUUID()}.jpg`;
      const filepath = join(uploadsDir, filename);

      let processedBuffer: Buffer;
      try {
        const sharpMod = await import("sharp");
        const sharp = (sharpMod as any).default || sharpMod;
        processedBuffer = await sharp(buf)
          .resize(480, 480, { fit: "cover", position: "centre" })
          .jpeg({ quality: 85 })
          .toBuffer();
      } catch (err) {
        console.error("Bildverarbeitung mit sharp fehlgeschlagen, speichere Originalbild:", err);
        processedBuffer = buf;
      }

      await writeFile(filepath, processedBuffer);
      const imageUrl = `/uploads/reactions/${filename}`;

      const existing = await db
        .select()
        .from(userReactions)
        .where(and(eq(userReactions.userId, userId), eq(userReactions.emoji, input.emoji)))
        .limit(1);

      if (existing.length > 0) {
        const existingId = existing[0].id;
        await db
          .update(userReactions)
          .set({ imageUrl, creationDate: new Date() as any })
          .where(eq(userReactions.id, existingId));
        return { id: existingId, updated: true } as const;
      }

      const inserted = await db
        .insert(userReactions)
        .values({ userId, imageUrl, emoji: input.emoji })
        .returning();

      return { id: inserted[0].id, updated: false } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;
      const rows = await db
        .select()
        .from(userReactions)
        .where(and(eq(userReactions.id, input.id), eq(userReactions.userId, userId)))
        .limit(1);
      if (rows.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Reaktion nicht gefunden oder gehört nicht dem Benutzer" });
      }
      await db.delete(userReactions).where(eq(userReactions.id, input.id));
      return { success: true } as const;
    }),
});
