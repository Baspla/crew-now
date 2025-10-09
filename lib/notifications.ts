import { and, eq, inArray, ne } from 'drizzle-orm'
import { db, users, userSettings, comments as commentsTable } from '@/lib/db/schema'
import { renderTemplate, sendEmail, type TemplatePayload } from '@/lib/email'

// Benachrichtigungen: granular pro Ereignis

export async function notifyMomentStart(startDate: Date) {
	const rows = await db
		.select({ email: users.email, userId: users.id })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(eq(userSettings.emailNotifyDailyMoment, 1))

	if (!rows.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'moment', startDate })
	let sent = 0
	for (const r of rows) {
		if (!r.email) continue
		try {
			await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
			sent++
		} catch (e) {
			console.error('Failed to send moment email to', r.userId, e)
		}
	}
	return { sent }
}

export async function notifyNewPost(postId: string, authorId: string, authorName?: string | null) {
	const recipients = await db
		.select({ email: users.email, userId: users.id })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(eq(userSettings.emailNotifyNewPosts, 1), ne(users.id, authorId)))

	if (!recipients.length) return { sent: 0 }
	const rendered = renderTemplate({ type: 'new-post', authorName, postId })
	let sent = 0
	for (const r of recipients) {
		if (!r.email) continue
		try {
			await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
			sent++
		} catch (e) {
			console.error('Failed to send new-post email to', r.userId, e)
		}
	}
	return { sent }
}

export async function notifyCommentCreated(opts: { postId: string; actorId: string; actorName?: string | null; postAuthorId: string }) {
	const { postId, actorId, actorName, postAuthorId } = opts

	const recipientsSet = new Set<string>()

	// 1) Post-Autor, wenn Scope >=1
	const authorRows = await db
		.select({ email: users.email, userId: users.id, scope: userSettings.emailCommentScope })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(eq(users.id, postAuthorId))

	if (authorRows[0] && authorRows[0].scope >= 1 && authorRows[0].userId !== actorId && authorRows[0].email) {
		recipientsSet.add(JSON.stringify({ userId: authorRows[0].userId, email: authorRows[0].email }))
	}

	// 2) Nutzer, die bereits unter dem Post kommentiert haben (Scope >=2)
	const commenters = await db
		.select({ uid: commentsTable.userId })
		.from(commentsTable)
		.where(eq(commentsTable.postId, postId))
	const commenterIds = Array.from(new Set(commenters.map(c => c.uid).filter(uid => uid !== actorId)))
	if (commenterIds.length) {
		const rows = await db
			.select({ userId: users.id, email: users.email, scope: userSettings.emailCommentScope })
			.from(userSettings)
			.innerJoin(users, eq(users.id, userSettings.userId))
			.where(and(inArray(users.id, commenterIds), ne(users.id, actorId)))
		for (const r of rows) {
			if (r.scope >= 2 && r.email) recipientsSet.add(JSON.stringify({ userId: r.userId, email: r.email }))
		}
	}

	// 3) Alle Nutzer mit Scope == 3 (globale Kommentare), exkl. Actor
	const globalRows = await db
		.select({ userId: users.id, email: users.email })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(eq(userSettings.emailCommentScope, 3), ne(users.id, actorId)))

	for (const r of globalRows) {
		if (r.email) recipientsSet.add(JSON.stringify({ userId: r.userId, email: r.email }))
	}

	const recipients = Array.from(recipientsSet).map(s => JSON.parse(s) as { userId: string; email: string })
	if (!recipients.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'comment', actorName, postId })
	let sent = 0
	for (const r of recipients) {
		try {
			await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
			sent++
		} catch (e) {
			console.error('Failed to send comment email to', r.userId, e)
		}
	}
	return { sent }
}

export async function notifyReactionCreated(opts: { postId: string; actorId: string; actorName?: string | null; postAuthorId: string }) {
	const { postId, actorId, actorName, postAuthorId } = opts

	const recipientsSet = new Set<string>()

	// 1) Post-Autor bei Scope >=1
	const authorRows = await db
		.select({ email: users.email, userId: users.id, scope: userSettings.emailReactionScope })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(eq(users.id, postAuthorId))

	if (authorRows[0] && authorRows[0].scope >= 1 && authorRows[0].userId !== actorId && authorRows[0].email) {
		recipientsSet.add(JSON.stringify({ userId: authorRows[0].userId, email: authorRows[0].email }))
	}

	// 2) Alle Nutzer mit globalem Reaktions-Scope (==2), exkl. Actor
	const globals = await db
		.select({ userId: users.id, email: users.email })
		.from(userSettings)
		.innerJoin(users, eq(users.id, userSettings.userId))
		.where(and(eq(userSettings.emailReactionScope, 2), ne(users.id, actorId)))

	for (const r of globals) {
		if (r.email) recipientsSet.add(JSON.stringify({ userId: r.userId, email: r.email }))
	}

	const recipients = Array.from(recipientsSet).map(s => JSON.parse(s) as { userId: string; email: string })
	if (!recipients.length) return { sent: 0 }

	const rendered = renderTemplate({ type: 'reaction', actorName, postId })
	let sent = 0
	for (const r of recipients) {
		try {
			await sendEmail({ to: r.email, subject: rendered.subject, html: rendered.html, text: rendered.text })
			sent++
		} catch (e) {
			console.error('Failed to send reaction email to', r.userId, e)
		}
	}
	return { sent }
}

