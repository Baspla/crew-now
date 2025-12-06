import { createHash } from "crypto";

export function calculateHashTime(date: Date, TZ: string, startOfDay: Date, endOfDay: Date): number {
    const hashInput = `${date.toDateString()}@${TZ}`;
    const hash = createHash('md5').update(hashInput).digest('hex');
    const numericHash = parseInt(hash.slice(0, 8), 16); // Use first 8 characters of hash
    const hashRange = endOfDay.getTime() - startOfDay.getTime();
    const hashTime = startOfDay.getTime() + (numericHash % hashRange);
    return hashTime;
}


// Convert a local wall time in TZ to an actual UTC instant
const zonedTimeToUtc = (y: number, m: number, d: number, h = 0, mi = 0, s = 0, TZ: string) => {
    const candidate = new Date(Date.UTC(y, m - 1, d, h, mi, s));
    const offset = getTzOffsetMs(candidate,TZ);
    return new Date(candidate.getTime() - offset);
};

const getParts = (d: Date, TZ: string) => {
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
const getTzOffsetMs = (d: Date, TZ: string) => {
    const p = getParts(d, TZ);
    const asUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUTC - d.getTime();
};

export function getDateParts(date: Date, TZ: string = 'Europe/Berlin'): { nowDate: Date; now: number; todayParts: ReturnType<typeof getParts>; startOfDay: Date; endOfDay: Date } {

    const nowDate = date; // actual current UTC instant
    const now = nowDate.getTime();
    const todayParts = getParts(nowDate, TZ);
    const startOfDay = zonedTimeToUtc(todayParts.year, todayParts.month, todayParts.day, 8, 0, 0, TZ); // 08:00 Berlin
    const endOfDay = zonedTimeToUtc(todayParts.year, todayParts.month, todayParts.day, 20, 0, 0, TZ); // 20:00 Berlin
    return { nowDate, now, todayParts, startOfDay, endOfDay };
}