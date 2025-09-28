import { db, moment } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // This endpoint triggers a new moment creation.
    // It requires an internal token via header `x-internal-token` or query `token`
    const url = new URL(request.url);
    const tokenFromQuery = url.searchParams.get('token');
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
        await createNewMoment();
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error creating new moment', err);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}

async function createNewMoment() {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(8, 0, 0, 0); // Starting time of day
    const endOfDay = new Date();
    endOfDay.setHours(20, 0, 0, 0); // Ending time of day

    // Check if current time is between starting time of day and ending time of day
    if (now < startOfDay.getTime() || now > endOfDay.getTime()) {
        console.log('Current time is outside the allowed time range.');
        return;
    }

    // Fetch the latest moment from the database
    const lastMoment = await db.select().from(moment).orderBy(desc(moment.startDate)).limit(1);

    // Check if a moment was already created today
    if (lastMoment.length > 0) {
        const last = lastMoment[0];
        const lastMomentDate = new Date(last.startDate);
        const today = new Date();
        if (
            lastMomentDate.getFullYear() === today.getFullYear() &&
            lastMomentDate.getMonth() === today.getMonth() &&
            lastMomentDate.getDate() === today.getDate()
        ) {
            console.log('A moment was already created today.');
            return;
        }
    }

    // Calculate hash for today's time
    const hashInput = `${new Date().toDateString()}`;
    const hash = createHash('md5').update(hashInput).digest('hex');
    const numericHash = parseInt(hash.slice(0, 8), 16); // Use first 8 characters of hash
    const hashRange = endOfDay.getTime() - startOfDay.getTime();
    const hashTime = startOfDay.getTime() + (numericHash % hashRange);

    // Check if the hash for today's time is in the future
    if (hashTime > now) {
        console.log('Hash for today\'s time is in the future. (It will be at', new Date(hashTime).toISOString() + ')');
        return;
    }

    // Update the previous moment to end now
    if (lastMoment.length > 0) {
        const last = lastMoment[0];
        await db.update(moment).set({ endDate: new Date(now) }).where(eq(moment.id, last.id));
        console.log('Ended previous moment', last.id, 'at', new Date(now).toISOString());
    }

    // Create a new moment starting now
    await db.insert(moment).values({ startDate: new Date(now), endDate: null });
    console.log('New moment created at', new Date(now).toISOString());
}