import { and, desc, gte, lte, eq, count } from "drizzle-orm";
import { db, moment, posts, type Moment } from "./db/schema";


const envInt = (value: string | undefined, fallback: number): number => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
};

export const POST_WINDOW_SECONDS = envInt(
  process.env.POST_WINDOW_SECONDS ?? process.env.NEXT_PUBLIC_POST_WINDOW_SECONDS,
  600,
);

export const POSTS_ALLOWED_IF_POSTED_IN_WINDOW = envInt(
  process.env.POSTS_ALLOWED_IF_POSTED_IN_WINDOW,
  5,
);

export const POSTS_ALLOWED_IF_POSTED_OUTSIDE_WINDOW = envInt(
  process.env.POSTS_ALLOWED_IF_POSTED_OUTSIDE_WINDOW,
  2,
);

export function getLatestMoment(): Moment | null {
  const row = db
    .select()
    .from(moment)
    .orderBy(desc(moment.startDate))
    .limit(1)
    .get();

  return row ?? null;
}

export function getLatestMomentStart(): Date | null {
  const m = getLatestMoment();
  return m?.startDate ?? null;
}

export function getElapsedSinceLatestMomentSeconds(now: Date = new Date()): number | null {
  const start = getLatestMomentStart();
  if (!start) return null;
  const diffMs = now.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 1000));
}

export function getTimeLeftInWindowSeconds(now: Date = new Date()): number | null {
  const elapsed = getElapsedSinceLatestMomentSeconds(now);
  if (elapsed == null) return null;
  return Math.max(0, POST_WINDOW_SECONDS - elapsed);
}

export function hasUserPostedInWindow(userId: string, now: Date = new Date()): boolean {
  const start = getLatestMomentStart();
  if (!start) return false;

  const windowEnd = new Date(start.getTime() + POST_WINDOW_SECONDS * 1000);
  const row = db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.userId, userId),
        gte(posts.creationDate, start),
        lte(posts.creationDate, windowEnd),
      ),
    )
    .limit(1)
    .get();
  return !!row;
}

export function countUserPostsSinceLatestMoment(userId: string): number {
  const start = getLatestMomentStart();
  if (!start) return 0;

  const row = db
    .select({ value: count() })
    .from(posts)
    .where(and(eq(posts.userId, userId), gte(posts.creationDate, start)))
    .get();
  return row?.value ?? 0;
}

export function hasUserPostedSinceLatestMoment(userId: string): boolean {
  const start = getLatestMomentStart();
  if (!start) return false;

  const row = db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.userId, userId), gte(posts.creationDate, start)))
    .limit(1)
    .get();
  return !!row;
}

export function postsRemainingForUser(userId: string): number {
  const start = getLatestMomentStart();
  if (!start) return 0;

  const count = countUserPostsSinceLatestMoment(userId);
  const inWindow = hasUserPostedInWindow(userId);
  const limit = inWindow
    ? POSTS_ALLOWED_IF_POSTED_IN_WINDOW
    : POSTS_ALLOWED_IF_POSTED_OUTSIDE_WINDOW;

  return Math.max(0, limit - count);
}

export function getPostingStatus(userId: string, now: Date = new Date()) {
  const start = getLatestMomentStart();
  const elapsed = getElapsedSinceLatestMomentSeconds(now);
  const left = getTimeLeftInWindowSeconds(now);
  const inWindow = hasUserPostedInWindow(userId, now);
  const countSince = countUserPostsSinceLatestMoment(userId);
  const hasSince = countSince > 0;
  const remaining = postsRemainingForUser(userId);

  return {
    latestMomentStart: start,
    elapsedSeconds: elapsed,
    timeLeftInWindowSeconds: left,
    hasPostedInWindow: inWindow,
    postsSinceLatestMoment: countSince,
    postsRemaining: remaining,
    hasPostedSinceLatestMoment: hasSince,
    config: {
      POST_WINDOW_SECONDS,
      POSTS_ALLOWED_IF_POSTED_IN_WINDOW,
      POSTS_ALLOWED_IF_POSTED_OUTSIDE_WINDOW,
    },
  } as const;
}
