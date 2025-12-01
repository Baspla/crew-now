import { db, moment, posts, users } from "@/lib/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createHash } from 'crypto';
import { notifyMomentStart, notifyCheckInReminder } from '@/lib/notifications';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // This endpoint triggers a new moment creation.
    // It requires an internal token via header `x-internal-token` or query `token`
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');
    const forced = url.searchParams.get('force') === 'true';
    if (forced) {
        console.log('Force flag detected, creating new moment regardless of time checks');
    }
    const headerToken = request.headers.get('x-internal-token');
    const TOKEN = process.env.BACKEND_TOKEN || '';

    if (!TOKEN) {
        console.warn('BACKEND_TOKEN not set — rejecting external trigger calls');
    }
    const supplied = headerToken || tokenFromQuery || '';
    if (TOKEN && supplied !== TOKEN) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        console.log("Trying to create new moment and send check-in reminder if needed");
        await createNewMoment(forced);
        await checkAndSendReminder();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error creating new moment', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}

async function createNewMoment(forced: boolean) {
    // Always compute using Europe/Berlin timezone, regardless of container's local (UTC)
    const TZ = 'Europe/Berlin';

    // Helpers for timezone-safe calculations
    const dtf = new Intl.DateTimeFormat('en-GB', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
    });

    const getParts = (d: Date) => {
        const parts = dtf.formatToParts(d);
        const map: Record<string, number> = {};
        for (const p of parts) {
            if (p.type !== 'literal') map[p.type] = parseInt(p.value, 10);
        }
        return {
            year: map.year,
            month: map.month,
            day: map.day,
            hour: map.hour,
            minute: map.minute,
            second: map.second,
        } as const;
    };

    // Offset of TZ relative to UTC at given instant (ms)
    const getTzOffsetMs = (d: Date) => {
        const p = getParts(d);
        const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
        return asUTC - d.getTime();
    };

    // Convert a local wall time in TZ to an actual UTC instant
    const zonedTimeToUtc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0) => {
        const candidate = new Date(Date.UTC(y, m - 1, d, h, mi, s));
        const offset = getTzOffsetMs(candidate);
        return new Date(candidate.getTime() - offset);
    };

    const nowDate = new Date(); // actual current UTC instant
    const now = nowDate.getTime();
    const todayParts = getParts(nowDate);
    const startOfDay = zonedTimeToUtc(todayParts.year, todayParts.month, todayParts.day, 8, 0, 0); // 08:00 Berlin
    const endOfDay = zonedTimeToUtc(todayParts.year, todayParts.month, todayParts.day, 20, 0, 0); // 20:00 Berlin

    // Check if current time is between starting time of day and ending time of day (in Berlin time)
    if ((now < startOfDay.getTime() || now > endOfDay.getTime()) && !forced) {
        const humanNow = nowDate.toLocaleString('de-DE', { timeZone: TZ });
        const humanStart = startOfDay.toLocaleString('de-DE', { timeZone: TZ });
        const humanEnd = endOfDay.toLocaleString('de-DE', { timeZone: TZ });
        console.log(`Current time (${humanNow} ${TZ}) is outside the allowed time range ${humanStart} - ${humanEnd}.`);
        return;
    }

    // Fetch the latest moment from the database
    const lastMoment = await db.select().from(moment).orderBy(desc(moment.startDate)).limit(1);

    // Check if a moment was already created today
    if (lastMoment.length > 0 && !forced) {
        const last = lastMoment[0];
        const lastParts = getParts(new Date(last.startDate));
        if (
            lastParts.year === todayParts.year &&
            lastParts.month === todayParts.month &&
            lastParts.day === todayParts.day
        ) {
            console.log('A moment was already created today (Europe/Berlin day).');
            return;
        }
    }

    // Calculate hash for today's time
    const hashInput = `${nowDate.toDateString()}@${TZ}`;
    const hash = createHash('md5').update(hashInput).digest('hex');
    const numericHash = parseInt(hash.slice(0, 8), 16); // Use first 8 characters of hash
    const hashRange = endOfDay.getTime() - startOfDay.getTime();
    const hashTime = startOfDay.getTime() + (numericHash % hashRange);

    // Check if the hash for today's time is in the future
    if (hashTime > now && !forced) {
        const humanHash = new Date(hashTime).toLocaleString('de-DE', { timeZone: TZ });
        console.log('Hash for today\'s time is in the future. (It will be at', humanHash, TZ + ')');
        return;
    }

    // Update the previous moment to end now
    if (lastMoment.length > 0) {
        const last = lastMoment[0];
        await db.update(moment).set({ endDate: new Date(now) }).where(eq(moment.id, last.id));
        console.log('Ended previous moment', last.id, 'at', new Date(now).toLocaleString('de-DE', { timeZone: TZ }), TZ);
    }

    // Create a new moment starting now
    await db.insert(moment).values({ startDate: new Date(now), endDate: null });
    console.log('New moment created at', new Date(now).toLocaleString('de-DE', { timeZone: TZ }), TZ);

    // sende E-Mail-Benachrichtigung für tägliche Postzeit (granular)
    try {
        await notifyMomentStart(new Date(now))
    } catch (e) {
        console.error('Failed to send moment notifications', e)
    }

    // Send discord Webhook notification (if configured)
    const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
    const WEBHOOK_MESSAGE = process.env.WEBHOOK_MESSAGE || 'Crew Now Time!';
    if (WEBHOOK_URL) {
        try {
            console.log('Sending webhook notification to', WEBHOOK_URL);
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: WEBHOOK_MESSAGE }),
            });
            if (!response.ok) {
                console.error('Failed to send webhook notification', await response.text());
            } else {
                console.log('Webhook notification sent successfully');
            }
        } catch (error) {
            console.error('Error sending webhook notification', error);
        }
    } else {
        console.log('No WEBHOOK_URL configured, skipping webhook notification.');
    }
    return;
}

async function checkAndSendReminder() {
    // 1. Get latest moment
    const lastMoment = await db.select().from(moment).orderBy(desc(moment.startDate)).limit(1);
    if (!lastMoment.length){
        console.log("No moments found, skipping reminder");
        return;
    }
    const m = lastMoment[0];

    // 2. Check if reminder already sent
    if (m.reminderSent === 1) {
        console.debug("Reminder already sent, skipping reminder");
        return;
    }

    if (!m.startDate) {
        console.debug("Moment has no start date, skipping reminder");
        return;
    }

    // treat endDate === 0 as "unset"
    const hasEnded = m.endDate != null && m.endDate.getTime() !== 0;
    if (hasEnded) {
        console.debug("Moment already ended, skipping reminder", m.endDate);
        return;
    }

    // 3. Check delay
    const delayMinutes = parseInt(process.env.CHECK_IN_REMINDER_DELAY_MINUTES || '120', 10);
    const now = new Date().getTime();
    const start = m.startDate.getTime();
    const diffMinutes = (now - start) / (1000 * 60);

    if (diffMinutes < delayMinutes) {
        console.debug(`Not enough time passed since moment start (${diffMinutes.toFixed(1)} min), skipping reminder`);
        return;
    }

    // 4. Send reminder
    console.log(`Sending check-in reminder for moment ${m.id}`);
    
    // Get posters in this moment
    const posters = await db.select({ name: users.name })
        .from(posts)
        .innerJoin(users, eq(posts.userId, users.id))
        .where(gte(posts.creationDate, m.startDate));
    
    const posterNames = posters.map(p => p.name || 'Unbekannt');
    const uniqueNames = Array.from(new Set(posterNames));

    // if (uniqueNames.length === 0) {
    //     console.log("No posts yet, skipping reminder");
    //     return;
    // }

    await notifyCheckInReminder(uniqueNames);

    // 5. Mark as sent
    await db.update(moment).set({ reminderSent: 1 }).where(eq(moment.id, m.id));
}