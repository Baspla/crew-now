import { and, eq, inArray, ne, or } from 'drizzle-orm'
import { db, users, userSettings, comments as commentsTable } from '@/lib/db/schema'
import { renderTemplate, sendEmail, type TemplatePayload } from '@/lib/email'
import { sendNtfy } from '@/lib/ntfy'

// Benachrichtigungen: granular pro Ereignis

export async function notifyMomentStart(startDate: Date) {
	const rows = await db
		.select({
			email: users.email,
			userId: users.id,
			ntfyTopic: users.ntfyTopic,
			emailNotify: userSettings.emailNotifyDailyMoment,
			ntfyNotify: userSettings.ntfyNotifyDailyMoment
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(or(
			eq(userSettings.emailNotifyDailyMoment, 1),
			eq(userSettings.ntfyNotifyDailyMoment, 1)
		))

	if (!rows.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'moment', startDate })
	let sent = 0
	for (const r of rows) {
		// Email
		if (r.emailNotify === 1 && r.email) {
			try {
				await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
				sent++
			} catch (e) {
				console.error('Failed to send moment email to', r.userId, e)
			}
		}
		// Ntfy
		if (r.ntfyNotify === 1 && r.ntfyTopic) {
			try {
				await sendNtfy({
					topic: r.ntfyTopic,
					title: "Zeit für dein Crew Now!",
					message: "Es ist Zeit dein Crew Now Moment zu teilen.",
					tags: ["camera"],
					priority: 4,
					actions: [{ action: 'view', label: 'Jetzt aufnehmen', url: `${process.env.NEXT_PUBLIC_APP_URL}/create` }]
				})
				sent++
			} catch (e) {
				console.error('Failed to send moment ntfy to', r.userId, e)
			}
		}
	}
	return { sent }
}

export async function notifyNewPost(postId: string, authorId: string, authorName?: string | null) {
	const recipients = await db
		.select({
			email: users.email,
			userId: users.id,
			ntfyTopic: users.ntfyTopic,
			emailNotify: userSettings.emailNotifyNewPosts,
			ntfyNotify: userSettings.ntfyNotifyNewPosts
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(
			or(eq(userSettings.emailNotifyNewPosts, 1), eq(userSettings.ntfyNotifyNewPosts, 1)),
			ne(users.id, authorId)
		))

	if (!recipients.length) return { sent: 0 }
	const rendered = renderTemplate({ type: 'new-post', authorName, postId })
	let sent = 0
	for (const r of recipients) {
		if (r.emailNotify === 1 && r.email) {
			try {
				await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
				sent++
			} catch (e) {
				console.error('Failed to send new-post email to', r.userId, e)
			}
		}
		if (r.ntfyNotify === 1 && r.ntfyTopic) {
			try {
				await sendNtfy({
					topic: r.ntfyTopic,
					title: "Neuer Post",
					message: `${authorName || 'Jemand'} hat einen neuen Post erstellt.`,
					tags: ["camera_flash"],
					actions: [{ action: 'view', label: 'Ansehen', url: `${process.env.NEXT_PUBLIC_APP_URL}/posts/${postId}` }]
				})
				sent++
			} catch (e) {
				console.error('Failed to send new-post ntfy to', r.userId, e)
			}
		}
	}
	return { sent }
}

export async function notifyCommentCreated(opts: { postId: string; actorId: string; actorName?: string | null; postAuthorId: string }) {
	const { postId, actorId, actorName, postAuthorId } = opts

	const recipientsMap = new Map<string, {
		userId: string;
		email: string | null;
		ntfyTopic: string | null;
		emailScope: number;
		ntfyScope: number;
	}>()

	const addToMap = (rows: any[]) => {
		for (const r of rows) {
			if (r.userId === actorId) continue;
			recipientsMap.set(r.userId, {
				userId: r.userId,
				email: r.email,
				ntfyTopic: r.ntfyTopic,
				emailScope: r.emailScope ?? 0,
				ntfyScope: r.ntfyScope ?? 0
			})
		}
	}

	// 1) Post-Autor
	const authorRows = await db
		.select({
			email: users.email,
			userId: users.id,
			ntfyTopic: users.ntfyTopic,
			emailScope: userSettings.emailCommentScope,
			ntfyScope: userSettings.ntfyCommentScope
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(eq(users.id, postAuthorId))

	addToMap(authorRows);

	// 2) Nutzer, die bereits unter dem Post kommentiert haben
	const commenters = await db
		.select({ uid: commentsTable.userId })
		.from(commentsTable)
		.where(eq(commentsTable.postId, postId))
	const commenterIds = Array.from(new Set(commenters.map(c => c.uid).filter(uid => uid !== actorId)))

	if (commenterIds.length) {
		const rows = await db
			.select({
				userId: users.id,
				email: users.email,
				ntfyTopic: users.ntfyTopic,
				emailScope: userSettings.emailCommentScope,
				ntfyScope: userSettings.ntfyCommentScope
			})
			.from(userSettings)
			.innerJoin(users, eq(users.id, userSettings.userId))
			.where(and(inArray(users.id, commenterIds), ne(users.id, actorId)))
		addToMap(rows);
	}

	// 3) Alle Nutzer mit Scope == 3 (globale Kommentare)
	const globalRows = await db
		.select({
			userId: users.id,
			email: users.email,
			ntfyTopic: users.ntfyTopic,
			emailScope: userSettings.emailCommentScope,
			ntfyScope: userSettings.ntfyCommentScope
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(
			or(eq(userSettings.emailCommentScope, 3), eq(userSettings.ntfyCommentScope, 3)),
			ne(users.id, actorId)
		))

	addToMap(globalRows);

	const recipients = Array.from(recipientsMap.values());
	if (!recipients.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'comment', actorName, postId })
	let sent = 0

	for (const r of recipients) {
		let shouldEmail = false;
		let shouldNtfy = false;

		// Logic for Email
		if (r.emailScope === 3) shouldEmail = true;
		else if (r.emailScope === 2 && (commenterIds.includes(r.userId) || r.userId === postAuthorId)) shouldEmail = true;
		else if (r.emailScope === 1 && r.userId === postAuthorId) shouldEmail = true;

		// Logic for Ntfy
		if (r.ntfyScope === 3) shouldNtfy = true;
		else if (r.ntfyScope === 2 && (commenterIds.includes(r.userId) || r.userId === postAuthorId)) shouldNtfy = true;
		else if (r.ntfyScope === 1 && r.userId === postAuthorId) shouldNtfy = true;

		if (shouldEmail && r.email) {
			try {
				await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
				sent++
			} catch (e) {
				console.error('Failed to send comment email to', r.userId, e)
			}
		}

		if (shouldNtfy && r.ntfyTopic) {
			try {
				await sendNtfy({
					topic: r.ntfyTopic,
					title: "Neuer Kommentar",
					message: `${actorName || 'Jemand'} hat ein Kommentar hinterlassen.`,
					tags: ["speech_balloon"],
					actions: [{ action: 'view', label: 'Ansehen', url: `${process.env.NEXT_PUBLIC_APP_URL}/posts/${postId}` }]
				})
				sent++
			} catch (e) {
				console.error('Failed to send comment ntfy to', r.userId, e)
			}
		}
	}
	return { sent }
}

export async function notifyReactionCreated(opts: { postId: string; actorId: string; actorName?: string | null; postAuthorId: string }) {
	const { postId, actorId, actorName, postAuthorId } = opts

	const recipientsMap = new Map<string, {
		userId: string;
		email: string | null;
		ntfyTopic: string | null;
		emailScope: number;
		ntfyScope: number;
	}>()

	const addToMap = (rows: any[]) => {
		for (const r of rows) {
			if (r.userId === actorId) continue;
			recipientsMap.set(r.userId, {
				userId: r.userId,
				email: r.email,
				ntfyTopic: r.ntfyTopic,
				emailScope: r.emailScope ?? 0,
				ntfyScope: r.ntfyScope ?? 0
			})
		}
	}

	// 1) Post-Autor
	const authorRows = await db
		.select({
			email: users.email,
			userId: users.id,
			ntfyTopic: users.ntfyTopic,
			emailScope: userSettings.emailReactionScope,
			ntfyScope: userSettings.ntfyReactionScope
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(eq(users.id, postAuthorId))

	addToMap(authorRows);

	// 2) Alle Nutzer mit globalem Reaktions-Scope (==2)
	const globals = await db
		.select({
			userId: users.id,
			email: users.email,
			ntfyTopic: users.ntfyTopic,
			emailScope: userSettings.emailReactionScope,
			ntfyScope: userSettings.ntfyReactionScope
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(
			or(eq(userSettings.emailReactionScope, 2), eq(userSettings.ntfyReactionScope, 2)),
			ne(users.id, actorId)
		))

	addToMap(globals);

	const recipients = Array.from(recipientsMap.values());
	if (!recipients.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'reaction', actorName, postId })
	let sent = 0

	for (const r of recipients) {
		let shouldEmail = false;
		let shouldNtfy = false;

		// Logic for Email
		if (r.emailScope === 2) shouldEmail = true;
		else if (r.emailScope === 1 && r.userId === postAuthorId) shouldEmail = true;

		// Logic for Ntfy
		if (r.ntfyScope === 2) shouldNtfy = true;
		else if (r.ntfyScope === 1 && r.userId === postAuthorId) shouldNtfy = true;

		if (shouldEmail && r.email) {
			try {
				await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
				sent++
			} catch (e) {
				console.error('Failed to send reaction email to', r.userId, e)
			}
		}

		if (shouldNtfy && r.ntfyTopic) {
			try {
				await sendNtfy({
					topic: r.ntfyTopic,
					title: "Neue Reaktion",
					message: `${actorName || 'Jemand'} hat auf einen Post reagiert.`,
					tags: ["heart"],
					actions: [{ action: 'view', label: 'Ansehen', url: `${process.env.NEXT_PUBLIC_APP_URL}/posts/${postId}` }]
				})
				sent++
			} catch (e) {
				console.error('Failed to send reaction ntfy to', r.userId, e)
			}
		}
	}
	return { sent }
}

export async function notifyCheckInReminder(posterNames: string[]) {
	const recipients = await db
		.select({
			email: users.email,
			userId: users.id,
			name: users.name,
			ntfyTopic: users.ntfyTopic,
			emailNotify: userSettings.emailNotifyCheckInReminder,
			ntfyNotify: userSettings.ntfyNotifyCheckInReminder
		})
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(or(
			eq(userSettings.emailNotifyCheckInReminder, 1),
			eq(userSettings.ntfyNotifyCheckInReminder, 1)
		))

	if (!recipients.length) return { sent: 0 }

	let sent = 0

	for (const r of recipients) {
		const filteredPosterNames = posterNames.filter(name => name !== r.name);
		const rendered = renderTemplate({ type: 'check-in-reminder', posterNames: filteredPosterNames })

		if (r.emailNotify === 1 && r.email) {
			try {
				await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
				sent++
			} catch (e) {
				console.error('Failed to send check-in email to', r.userId, e)
			}
		}
		if (r.ntfyNotify === 1 && r.ntfyTopic) {
			try {
				const isBeFirst = filteredPosterNames.length === 0;
				let message = "Noch hat niemand gepostet. Sei der Erste!";

				if (!isBeFirst) {
					const names = filteredPosterNames;
					let namesStr = names[0];
					if (names.length === 2) namesStr = `${names[0]} und ${names[1]}`;
					else if (names.length > 2) namesStr = `${names.slice(0, -1).join(", ")} und ${names[names.length - 1]}`;
					message = `${namesStr} ${names.length === 1 ? 'hat' : 'haben'} ein Crew Now gepostet! Schau doch mal rein.`;
				}

				await sendNtfy({
					topic: r.ntfyTopic,
					title: rendered.subject,
					message,
					tags: isBeFirst ? ["rocket"] : ["eyes"],
					actions: [{ 
						action: 'view', 
						label: isBeFirst ? 'Jetzt posten' : 'Ansehen', 
						url: `${process.env.NEXT_PUBLIC_APP_URL}/${isBeFirst ? 'create' : 'feed'}` 
					}]
				})
				sent++
			} catch (e) {
				console.error('Failed to send check-in ntfy to', r.userId, e)
			}
		}
	}
	return { sent }
}

