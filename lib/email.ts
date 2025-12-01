import nodemailer from 'nodemailer'

export type BaseTemplatePayload = {
	appBaseUrl?: string // e.g. https://crew.example.com
}

export type MomentTemplatePayload = BaseTemplatePayload & {
	type: 'moment'
	startDate: Date
}

export type NewPostTemplatePayload = BaseTemplatePayload & {
	type: 'new-post'
	authorName?: string | null
	postId?: string
}

export type CommentTemplatePayload = BaseTemplatePayload & {
	type: 'comment'
	actorName?: string | null
	postId?: string
}

export type ReactionTemplatePayload = BaseTemplatePayload & {
	type: 'reaction'
	actorName?: string | null
	postId?: string
}

export type CheckInReminderTemplatePayload = BaseTemplatePayload & {
	type: 'check-in-reminder'
	posterNames: string[]
}

export type TemplatePayload = MomentTemplatePayload | NewPostTemplatePayload | CommentTemplatePayload | ReactionTemplatePayload | CheckInReminderTemplatePayload

export type RenderedTemplate = {
	subject: string
	html: string
	text: string
}

export type SendEmailParams = {
	to: string
	subject: string
	html: string
	text?: string
}

function getFromAddress() {
	const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'Crew Now <no-reply@localhost>'
	return from
}

function buildTransport() {
	// Prefer SMTP_URL if provided, otherwise host/port/user/pass
	const smtpUrl = process.env.SMTP_URL || process.env.EMAIL_SERVER
	if (smtpUrl) {
		return nodemailer.createTransport(smtpUrl)
	}
	const host = process.env.SMTP_HOST
	const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	if (!host || !user || !pass) {
		return null
	}
	return nodemailer.createTransport({
		host,
		port,
		secure: port === 465, // true for 465, false for others
		auth: { user, pass },
	})
}

export async function sendEmail(params: SendEmailParams) {
	const transport = buildTransport()
	const from = getFromAddress()

	if (!transport) {
		// Soft-fail in dev if not configured
		console.warn('Email transport not configured. Set SMTP_URL or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS to enable email sending.')
		console.info('[DEV email preview]', { from, ...params })
		return { preview: true }
	}
	const { to, subject, html, text } = params
	return transport.sendMail({ from, to, subject, html, text: text || htmlToText(html) })
}

function htmlLayout(title: string, body: string) {
	return `<!doctype html>
	<html>
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>${escapeHtml(title)}</title>
			<style>
				body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color: #111827; }
				.container { max-width: 560px; margin: 24px auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; }
				.btn { display: inline-block; background: #111827; color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; }
				.muted { color: #6b7280; font-size: 12px; }
			</style>
		</head>
		<body>
			<div class="container">
				${body}
				<p class="muted">Du kannst deine Benachrichtigungen hier anpassen: <a href="${process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '#'}/settings">Einstellungen</a></p>
			</div>
		</body>
	</html>`
}

function escapeHtml(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

function htmlToText(html: string): string {
	// very small fallback conversion
	return html.replace(/<br\s*\/>/gi, '\n').replace(/<[^>]+>/g, '').replace(/\s+\n/g, '\n').trim()
}

export function renderTemplate(payload: TemplatePayload): RenderedTemplate {
	if (payload.type === 'moment') {
		const base = payload.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
		const title = 'Crew Now Time!'
		const ctaUrl = base ? `${base}/create` : undefined
		const html = htmlLayout(title, `
			<h1>${title}</h1>
			<p>Es ist Zeit dein Crew Now für heute zu posten.</p>
			${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Jetzt posten</a></p>` : ''}
			<p class="muted">Start: ${payload.startDate.toLocaleString()}</p>
		`)
		const text = `Crew Now Time! Es ist Zeit dein Crew Now für heute zu posten.${ctaUrl ? `\nJetzt posten: ${ctaUrl}` : ''}`
		return { subject: 'Crew Now Time!', html, text }
	}

	if (payload.type === 'new-post') {
		const base = payload.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
		const title = `Neuer Post${payload.authorName ? ` von ${payload.authorName}` : ''}`
		const ctaUrl = base && payload.postId ? `${base}/posts/${payload.postId}` : base || undefined
		const html = htmlLayout(title, `
			<h1>${escapeHtml(title)}</h1>
			<p>Jemand hat ein neues Bild gepostet.</p>
			${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Zum Beitrag</a></p>` : ''}
		`)
		const text = `${title}. ${ctaUrl ? `Zum Beitrag: ${ctaUrl}` : ''}`.trim()
		return { subject: `${title}`, html, text }
	}

	if (payload.type === 'comment') {
		const base = payload.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
		const title = `Neuer Kommentar${payload.actorName ? ` von ${payload.actorName}` : ''}`
		const ctaUrl = base && payload.postId ? `${base}/posts/${payload.postId}` : base || undefined
		const html = htmlLayout(title, `
			<h1>${escapeHtml(title)}</h1>
			<p>Es gibt einen neuen Kommentar.</p>
			${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Ansehen</a></p>` : ''}
		`)
		const text = `${title}. ${ctaUrl ? `Ansehen: ${ctaUrl}` : ''}`.trim()
		return { subject: `${title}`, html, text }
	}

	if (payload.type === 'reaction') {
		const base = payload.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
		const title = `Neue Reaktion${payload.actorName ? ` von ${payload.actorName}` : ''}`
		const ctaUrl = base && payload.postId ? `${base}/posts/${payload.postId}` : base || undefined
		const html = htmlLayout(title, `
			<h1>${escapeHtml(title)}</h1>
			<p>Dein Feed hat eine neue Reaktion.</p>
			${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Ansehen</a></p>` : ''}
		`)
		const text = `${title}. ${ctaUrl ? `Ansehen: ${ctaUrl}` : ''}`.trim()
		return { subject: `${title}`, html, text }
	}

	if (payload.type === 'check-in-reminder') {
		const base = payload.appBaseUrl || process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
		const names = payload.posterNames

		if (names.length === 0) {
			const title = "Sei der Erste!"
			const ctaUrl = base ? `${base}/create` : undefined
			const html = htmlLayout(title, `
				<h1>${escapeHtml(title)}</h1>
				<p>Noch hat niemand seinen Moment geteilt. Sei der Erste!</p>
				${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Jetzt posten</a></p>` : ''}
			`)
			const text = `${title} Noch hat niemand seinen Moment geteilt. ${ctaUrl ? `Jetzt posten: ${ctaUrl}` : ''}`.trim()
			return { subject: title, html, text }
		}

		let namesStr = "Jemand"
		if (names.length === 1) namesStr = names[0]
		else if (names.length === 2) namesStr = `${names[0]} & ${names[1]}`
		else if (names.length > 2) {
			const last = names[names.length - 1]
			const rest = names.slice(0, -1).join(", ")
			namesStr = `${rest} & ${last}`
		}
		
		const verb = names.length === 1 ? "hat" : "haben"
		const title = `Da passiert was!`
		const ctaUrl = base ? `${base}/feed` : undefined
		
		const html = htmlLayout(title, `
			<h1>${escapeHtml(title)}</h1>
			<p>Schau mal rein, ${namesStr} ${verb} etwas etwas in Crew Now gepostet.</p>
			${ctaUrl ? `<p><a class="btn" href="${ctaUrl}">Zum Feed</a></p>` : ''}
		`)
		const text = `${title}, schau mal rein! ${ctaUrl ? `Zum Feed: ${ctaUrl}` : ''}`.trim()
		return { subject: title, html, text }
	}

	// Fallback – shouldn’t normally happen
	const html = htmlLayout('Benachrichtigung', '<p>Es gibt Neuigkeiten.</p>')
	return { subject: 'Benachrichtigung', html, text: 'Es gibt Neuigkeiten.' }
}

