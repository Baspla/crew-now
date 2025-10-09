import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { db, userSettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const SettingsUpdateInput = z.object({
  emailNotifyDailyMoment: z.boolean().default(false),
  emailNotifyNewPosts: z.boolean().default(false),
  emailCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  emailReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
});

const SettingsOutput = z.object({
  emailNotifyDailyMoment: z.boolean(),
  emailNotifyNewPosts: z.boolean(),
  emailCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  emailReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  currentEmail: z.string().nullable(),
});

export type SettingsDTO = z.infer<typeof SettingsOutput>;

export const settingsRouter = router({
  get: protectedProcedure
    .output(SettingsOutput)
    .query(async ({ ctx }) => {
      const userId = ctx.session!.user!.id!;

      const rows = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      const userRow = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const currentEmail = userRow[0]?.email ?? null;

      if (!rows[0]) {
        return {
          emailNotifyDailyMoment: false,
          emailNotifyNewPosts: false,
          emailCommentScope: 0,
          emailReactionScope: 0,
          currentEmail,
        };
      }

      const s = rows[0];
      return {
        emailNotifyDailyMoment: !!s.emailNotifyDailyMoment,
        emailNotifyNewPosts: !!s.emailNotifyNewPosts,
        emailCommentScope: (s.emailCommentScope as 0 | 1 | 2 | 3) ?? 0,
        emailReactionScope: (s.emailReactionScope as 0 | 1 | 2) ?? 0,
        currentEmail,
      } satisfies SettingsDTO;
    }),

  update: protectedProcedure
    .input(SettingsUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session!.user!.id!;
      const now = new Date();

      // Update first
      await db
        .update(userSettings)
        .set({
          emailNotifyDailyMoment: input.emailNotifyDailyMoment ? 1 : 0,
          emailNotifyNewPosts: input.emailNotifyNewPosts ? 1 : 0,
          emailCommentScope: Math.max(0, Math.min(3, Math.floor(input.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          emailReactionScope: Math.max(0, Math.min(2, Math.floor(input.emailReactionScope ?? 0))) as 0 | 1 | 2,
          updatedDate: now,
        })
        .where(eq(userSettings.userId, userId));

      // Upsert-style: insert if not existing
      const current = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      if (!current[0]) {
        await db.insert(userSettings).values({
          userId,
          emailNotifyDailyMoment: input.emailNotifyDailyMoment ? 1 : 0,
          emailNotifyNewPosts: input.emailNotifyNewPosts ? 1 : 0,
          emailCommentScope: Math.max(0, Math.min(3, Math.floor(input.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          emailReactionScope: Math.max(0, Math.min(2, Math.floor(input.emailReactionScope ?? 0))) as 0 | 1 | 2,
          creationDate: now,
          updatedDate: now,
        });
      }

      return { ok: true } as const;
    }),
});
