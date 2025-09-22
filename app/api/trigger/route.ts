import { db, moment } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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
    // create a new momemnt starting now.
    // update the previous moment to end now.
    const now = Date.now();
    const lastMoment = await db.select().from(moment).orderBy(desc(moment.startDate)).limit(1);
    if (lastMoment.length > 0) {
        const last = lastMoment[0];
        await db.update(moment).set({ endDate: new Date(now) }).where(eq(moment.id, last.id));
        console.log('Ended previous moment', last.id, 'at', new Date(now).toISOString());
    }
    await db.insert(moment).values({ startDate: new Date(now), endDate: null });
    console.log('New moment created at', new Date(now).toISOString());
    return;
}