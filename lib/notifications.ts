import { eq, gte } from 'drizzle-orm'
import { db, users, userSettings } from '@/lib/db/schema'
import { renderTemplate, sendEmail, type NotificationLevel, type TemplatePayload } from '@/lib/email'

type MinimalUser = {
	id: string
	name: string | null
	email: string | null
	emailNotificationsLevel: number
}

/**
 * Prüft die Benachrichtigungseinstellung eines Users und versendet ggf. eine E-Mail.
 * level: 1=Trigger/Moment, 2=Neuer Post, 3=Aktivität (Reaktion/Kommentar/...)
 */
export async function notifyUserByLevel(
	userId: string,
	level: NotificationLevel,
	payload: TemplatePayload
) {
	const settingRows = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1)
	const setting = settingRows[0]
	if (!setting || (setting.emailNotificationsLevel ?? 0) < level) {
		return { skipped: true, reason: 'level-disabled' }
	}

	const userRows = await db.select().from(users).where(eq(users.id, userId)).limit(1)
	const user = userRows[0]
	if (!user || !user.email) {
		return { skipped: true, reason: 'no-email' }
	}

	const rendered = renderTemplate(level, payload)
	await sendEmail({ to: user.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
	return { sent: true }
}

/**
 * Sendet eine E-Mail an alle Nutzer, deren emailNotificationsLevel >= level ist.
 * Nutzt dieselbe Vorlage/den selben Payload für alle.
 */
export async function notifyAllEligibleByLevel(
	level: NotificationLevel,
	payload: TemplatePayload
) {
	const rows = await db
		.select({
			userId: userSettings.userId,
			emailNotificationsLevel: userSettings.emailNotificationsLevel,
			email: users.email,
			name: users.name,
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(gte(userSettings.emailNotificationsLevel, level))

	if (!rows.length) return { sent: 0 }

	const rendered = renderTemplate(level, payload)
	let sent = 0
	for (const row of rows) {
		if (!row.email) continue
		try {
			await sendEmail({ to: row.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
			sent += 1
		} catch (err) {
			console.error('Email send failed for user', row.userId, err)
		}
	}
	return { sent }
}

/**
 * Utility: hole einen MinimalUser inkl. Settings (zur optionalen Personalisierung von Vorlagen).
 */
export async function getUserWithSettings(userId: string): Promise<MinimalUser | null> {
	const rows = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			emailNotificationsLevel: userSettings.emailNotificationsLevel,
		})
		.from(users)
		.innerJoin(userSettings, eq(userSettings.userId, users.id))
		.where(eq(users.id, userId))
		.limit(1)

	return rows[0] || null
}

