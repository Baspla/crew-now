"use server"

import { auth } from "@/auth"
import { db, userSettings } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export type SettingsDTO = {
	emailNotificationsLevel: number
}

export async function getSettings(): Promise<SettingsDTO | null> {
	const session = await auth()
	const userId = session?.user?.id
	if (!userId) return null

	const rows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
	if (!rows[0]) return { emailNotificationsLevel: 0 }
	return { emailNotificationsLevel: rows[0].emailNotificationsLevel ?? 0 }
}

export async function updateSettings(data: SettingsDTO): Promise<{ ok: true } | { ok: false; error: string }> {
	const session = await auth()
	const userId = session?.user?.id
	if (!userId) return { ok: false, error: "UNAUTHORIZED" }

	const level = Math.max(0, Math.min(3, Math.floor(data.emailNotificationsLevel ?? 0)))
	const now = new Date()

	// Try update first, then insert if nothing updated
	const result = await db
		.update(userSettings)
		.set({ emailNotificationsLevel: level, updatedDate: now })
		.where(eq(userSettings.userId, userId))

	// drizzle-better-sqlite returns changes via run, but high-level may not expose; perform upsert-like logic
	const current = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
	if (!current[0]) {
		await db.insert(userSettings).values({ userId, emailNotificationsLevel: level, creationDate: now, updatedDate: now })
	}

	return { ok: true }
}

	// Form action wrapper for use in <form action={...}>
	export async function updateSettingsAction(formData: FormData): Promise<void> {
		const raw = formData.get('emailNotificationsLevel')
		const level = Number(raw ?? 0)
		await updateSettings({ emailNotificationsLevel: Number.isFinite(level) ? level : 0 })
	}

