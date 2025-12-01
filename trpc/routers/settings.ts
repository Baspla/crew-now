import { protectedProcedure, router } from "../init";
import { z } from "zod";
import { db, userSettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendNtfy } from "@/lib/ntfy";

const SettingsUpdateInput = z.object({
  emailNotifyDailyMoment: z.boolean().default(false),
  emailNotifyNewPosts: z.boolean().default(false),
  emailNotifyCheckInReminder: z.boolean().default(false),
  emailCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  emailReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
  ntfyNotifyDailyMoment: z.boolean().default(false),
  ntfyNotifyNewPosts: z.boolean().default(false),
  ntfyNotifyCheckInReminder: z.boolean().default(false),
  ntfyCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).default(0),
  ntfyReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
});

const SettingsOutput = z.object({
  emailNotifyDailyMoment: z.boolean(),
  emailNotifyNewPosts: z.boolean(),
  emailNotifyCheckInReminder: z.boolean(),
  emailCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  emailReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  ntfyNotifyDailyMoment: z.boolean(),
  ntfyNotifyNewPosts: z.boolean(),
  ntfyNotifyCheckInReminder: z.boolean(),
  ntfyCommentScope: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  ntfyReactionScope: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  currentEmail: z.string().nullable(),
  ntfyTopic: z.string().nullable(),
  ntfyServer: z.string().nullable(),
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
        .select({ email: users.email, ntfyTopic: users.ntfyTopic })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      const currentEmail = userRow[0]?.email ?? null;
      const ntfyTopic = userRow[0]?.ntfyTopic ?? null;
      const ntfyServer = process.env.NTFY_SERVER ?? null;

      if (!rows[0]) {
        return {
          emailNotifyDailyMoment: false,
          emailNotifyNewPosts: false,
          emailNotifyCheckInReminder: false,
          emailCommentScope: 0,
          emailReactionScope: 0,
          ntfyNotifyDailyMoment: false,
          ntfyNotifyNewPosts: false,
          ntfyNotifyCheckInReminder: false,
          ntfyCommentScope: 0,
          ntfyReactionScope: 0,
          currentEmail,
          ntfyTopic,
          ntfyServer,
        };
      }

      const s = rows[0];
      return {
        emailNotifyDailyMoment: !!s.emailNotifyDailyMoment,
        emailNotifyNewPosts: !!s.emailNotifyNewPosts,
        emailNotifyCheckInReminder: !!s.emailNotifyCheckInReminder,
        emailCommentScope: (s.emailCommentScope as 0 | 1 | 2 | 3) ?? 0,
        emailReactionScope: (s.emailReactionScope as 0 | 1 | 2) ?? 0,
        ntfyNotifyDailyMoment: !!s.ntfyNotifyDailyMoment,
        ntfyNotifyNewPosts: !!s.ntfyNotifyNewPosts,
        ntfyNotifyCheckInReminder: !!s.ntfyNotifyCheckInReminder,
        ntfyCommentScope: (s.ntfyCommentScope as 0 | 1 | 2 | 3) ?? 0,
        ntfyReactionScope: (s.ntfyReactionScope as 0 | 1 | 2) ?? 0,
        currentEmail,
        ntfyTopic,
        ntfyServer,
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
          emailNotifyCheckInReminder: input.emailNotifyCheckInReminder ? 1 : 0,
          emailCommentScope: Math.max(0, Math.min(3, Math.floor(input.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          emailReactionScope: Math.max(0, Math.min(2, Math.floor(input.emailReactionScope ?? 0))) as 0 | 1 | 2,
          ntfyNotifyDailyMoment: input.ntfyNotifyDailyMoment ? 1 : 0,
          ntfyNotifyNewPosts: input.ntfyNotifyNewPosts ? 1 : 0,
          ntfyNotifyCheckInReminder: input.ntfyNotifyCheckInReminder ? 1 : 0,
          ntfyCommentScope: Math.max(0, Math.min(3, Math.floor(input.ntfyCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          ntfyReactionScope: Math.max(0, Math.min(2, Math.floor(input.ntfyReactionScope ?? 0))) as 0 | 1 | 2,
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
          emailNotifyCheckInReminder: input.emailNotifyCheckInReminder ? 1 : 0,
          emailCommentScope: Math.max(0, Math.min(3, Math.floor(input.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          emailReactionScope: Math.max(0, Math.min(2, Math.floor(input.emailReactionScope ?? 0))) as 0 | 1 | 2,
          ntfyNotifyDailyMoment: input.ntfyNotifyDailyMoment ? 1 : 0,
          ntfyNotifyNewPosts: input.ntfyNotifyNewPosts ? 1 : 0,
          ntfyNotifyCheckInReminder: input.ntfyNotifyCheckInReminder ? 1 : 0,
          ntfyCommentScope: Math.max(0, Math.min(3, Math.floor(input.ntfyCommentScope ?? 0))) as 0 | 1 | 2 | 3,
          ntfyReactionScope: Math.max(0, Math.min(2, Math.floor(input.ntfyReactionScope ?? 0))) as 0 | 1 | 2,
          creationDate: now,
          updatedDate: now,
        });
      }

      return { ok: true } as const;
    }),

  regenerateNtfyTopic: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session!.user!.id!;
      const prefix = process.env.NTFY_TOPIC_PREFIX || 'crewnow';
      const cleanPrefix = prefix.replace(/^\/+/, '').replace(/\/+$/, '');
      const newTopic = `${cleanPrefix}-${crypto.randomUUID()}`;

      await db.update(users)
        .set({ ntfyTopic: newTopic })
        .where(eq(users.id, userId));

      return { topic: newTopic };
    }),

  testNtfy: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.session!.user!.id!;
      const userRow = await db
        .select({ ntfyTopic: users.ntfyTopic })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const topic = userRow[0]?.ntfyTopic;
      if (!topic) {
        throw new Error("Kein Ntfy Topic konfiguriert");
      }

      await sendNtfy({
        topic,
        title: "Test Benachrichtigung",
        message: "Dies ist eine Test-Benachrichtigung von Crew Now.",
        tags: ["tada"],
        priority: 3,
      });

      return { ok: true };
    }),
});
