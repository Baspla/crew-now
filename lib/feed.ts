"use server";

import { db, posts, users, moment, reactions as reactionsTable, userReactions, comments } from "@/lib/db/schema";
import type { Post } from "@/lib/db/schema";
import { SQL, and, desc, eq, gte, inArray, lte, count } from "drizzle-orm";

export type FeedPost = Post & {
  userName: string | null;
  userImage: string | null;
  reactions?: Array<{
    id: string | number;
    userId: string;
    emoji?: string;
    imageUrl?: string;
  }>;
  commentCount: number;
};

/**
 * Liefert die aktuellen Feed-Posts inkl. Reaktionen, gefiltert ab dem neuesten Moment-Start (falls vorhanden).
 * Diese Funktion läuft auf dem Server und kapselt alle DB-Queries für die Feed-Seite.
 */
export type PostsWithReactionsOptions = {
  limit?: number;
  where?: SQL<unknown>;
};

/**
 * Basiskomposition: Lädt Posts inkl. Userdaten und aggregiert Reaktionen.
 * Optionale Filter können via `where` übergeben werden.
 */
export async function getPostsWithReactions({ limit = 50, where }: PostsWithReactionsOptions = {}): Promise<FeedPost[]> {
  let query = db
    .select({
      id: posts.id,
      imageUrl: posts.imageUrl,
      frontImageUrl: posts.frontImageUrl,
      caption: posts.caption,
      creationDate: posts.creationDate,
      userId: posts.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.creationDate))
    .limit(limit);

  if (where) {
    // @ts-expect-error drizzle types allow SQL conditions here
    query = query.where(where);
  }

  const allPosts = await query;

  // Reaktionen der geladenen Posts holen und den Posts beilegen
  const postIds = allPosts.map((p) => p.id);
  type ReactionForPost = { id: string | number; userId: string; emoji?: string; imageUrl?: string };
  let postsWithReactions = allPosts as (typeof allPosts[number] & { reactions?: ReactionForPost[]; commentCount: number })[];

  if (postIds.length > 0) {
    const allReactions = await db
      .select({
        id: reactionsTable.id,
        postId: reactionsTable.postId,
        userId: reactionsTable.userId,
        emoji: userReactions.emoji,
        imageUrl: userReactions.imageUrl,
        creationDate: reactionsTable.creationDate,
      })
      .from(reactionsTable)
      .leftJoin(userReactions, eq(reactionsTable.reactionId, userReactions.id))
      .where(inArray(reactionsTable.postId, postIds))
      .orderBy(desc(reactionsTable.creationDate));

    const grouped = new Map<string, { id: string; userId: string; emoji?: string; imageUrl?: string; creationDate: Date }[]>();
    for (const r of allReactions) {
      const list = grouped.get(r.postId) ?? [];
      const item: { id: string; userId: string; emoji?: string; imageUrl?: string; creationDate: Date } = {
        id: r.id,
        userId: r.userId,
        creationDate: r.creationDate,
        ...(r.emoji ? { emoji: r.emoji } : {}),
        ...(r.imageUrl ? { imageUrl: r.imageUrl } : {}),
      };
      list.push(item);
      grouped.set(r.postId, list);
    }

    const commentCounts = await db
      .select({
        postId: comments.postId,
        count: count(comments.id),
      })
      .from(comments)
      .where(inArray(comments.postId, postIds))
      .groupBy(comments.postId);

    const commentCountMap = new Map<string, number>();
    for (const c of commentCounts) {
      commentCountMap.set(c.postId, c.count);
    }

    postsWithReactions = allPosts.map((p) => ({
      ...p,
      reactions: grouped.get(p.id)?.map(({ creationDate, ...rest }) => rest) ?? [],
      commentCount: commentCountMap.get(p.id) ?? 0,
    }));
  } else {
    postsWithReactions = [];
  }

  return postsWithReactions as FeedPost[];
}

/**
 * Feed-Posts ab dem neuesten Moment (falls vorhanden).
 */
export async function getFeedPosts(limit: number = 50): Promise<FeedPost[]> {
  const latestMoment = await db
    .select({ startDate: moment.startDate })
    .from(moment)
    .orderBy(desc(moment.startDate))
    .limit(1);

  const latestStart = latestMoment[0]?.startDate ?? null;

  return getPostsWithReactions({
    limit,
    where: latestStart ? gte(posts.creationDate, latestStart) : undefined,
  });
}

/**
 * Posts eines bestimmten Users inkl. Reaktionen.
 */
export async function getUserPosts(userId: string, limit: number = 50): Promise<FeedPost[]> {
  return getPostsWithReactions({
    limit,
    where: eq(posts.userId, userId),
  });
}

/**
 * Posts innerhalb eines Moments (per ID) inkl. Reaktionen.
 */
export async function getPostsForMoment(momentId: string, limit: number = 100): Promise<FeedPost[]> {
  const momentRow = await db
    .select({ startDate: moment.startDate, endDate: moment.endDate })
    .from(moment)
    .where(eq(moment.id, momentId))
    .limit(1);

  const range = momentRow[0];
  if (!range) return [];

  const condition = (range.endDate
    ? and(gte(posts.creationDate, range.startDate), lte(posts.creationDate, range.endDate))
    : gte(posts.creationDate, range.startDate)) as SQL<unknown>;

  return getPostsWithReactions({ limit, where: condition });
}
