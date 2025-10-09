"use server"

import { auth } from "@/auth"
import { db, userSettings, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

export type SettingsDTO = {
	emailNotifyDailyMoment: boolean
	emailNotifyNewPosts: boolean
	emailCommentScope: 0 | 1 | 2 | 3
	emailReactionScope: 0 | 1 | 2
	currentEmail: string | null
}

export async function getSettings(): Promise<SettingsDTO | null> {
	const session = await auth()
	const userId = session?.user?.id
	if (!userId) return null

		const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
		const userRow = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
		const currentEmail = userRow[0]?.email ?? null
		if (!rows[0]) {
		return {
			emailNotifyDailyMoment: false,
			emailNotifyNewPosts: false,
			emailCommentScope: 0,
			emailReactionScope: 0,
				currentEmail,
		}
	}
	const s = rows[0]
	return {
		emailNotifyDailyMoment: !!s.emailNotifyDailyMoment,
		emailNotifyNewPosts: !!s.emailNotifyNewPosts,
		emailCommentScope: (s.emailCommentScope as 0 | 1 | 2 | 3) ?? 0,
		emailReactionScope: (s.emailReactionScope as 0 | 1 | 2) ?? 0,
			currentEmail,
	}
}

export async function updateSettings(data: SettingsDTO): Promise<{ ok: true } | { ok: false; error: string }> {
	const session = await auth()
	const userId = session?.user?.id
	if (!userId) return { ok: false, error: "UNAUTHORIZED" }
	const now = new Date()

	// Try update first, then insert if nothing updated
	const result = await db
		.update(userSettings)
		.set({
			emailNotifyDailyMoment: data.emailNotifyDailyMoment ? 1 : 0,
			emailNotifyNewPosts: data.emailNotifyNewPosts ? 1 : 0,
			emailCommentScope: Math.max(0, Math.min(3, Math.floor(data.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
			emailReactionScope: Math.max(0, Math.min(2, Math.floor(data.emailReactionScope ?? 0))) as 0 | 1 | 2,
			updatedDate: now,
		})
		.where(eq(userSettings.userId, userId))

	// drizzle-better-sqlite returns changes via run, but high-level may not expose; perform upsert-like logic
	const current = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
	if (!current[0]) {
		await db.insert(userSettings).values({
			userId,
			emailNotifyDailyMoment: data.emailNotifyDailyMoment ? 1 : 0,
			emailNotifyNewPosts: data.emailNotifyNewPosts ? 1 : 0,
			emailCommentScope: Math.max(0, Math.min(3, Math.floor(data.emailCommentScope ?? 0))) as 0 | 1 | 2 | 3,
			emailReactionScope: Math.max(0, Math.min(2, Math.floor(data.emailReactionScope ?? 0))) as 0 | 1 | 2,
			creationDate: now,
			updatedDate: now,
		})
	}

	return { ok: true }
}

	// Form action wrapper for use in <form action={...}>
	export async function updateSettingsAction(formData: FormData): Promise<void> {
		const emailNotifyDailyMoment = formData.get('emailNotifyDailyMoment') === 'on'
		const emailNotifyNewPosts = formData.get('emailNotifyNewPosts') === 'on'
		const emailCommentScope = Number(formData.get('emailCommentScope') ?? 0)
		const emailReactionScope = Number(formData.get('emailReactionScope') ?? 0)

		await updateSettings({
			emailNotifyDailyMoment,
			emailNotifyNewPosts,
			emailCommentScope: Number.isFinite(emailCommentScope) ? (emailCommentScope as 0 | 1 | 2 | 3) : 0,
			emailReactionScope: Number.isFinite(emailReactionScope) ? (emailReactionScope as 0 | 1 | 2) : 0,
				currentEmail: null,
		})
	}
