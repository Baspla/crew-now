"use server";

import { db, posts, users, moment, reactions as reactionsTable, userReactions } from "@/lib/db/schema";
import type { Post } from "@/lib/db/schema";
import { desc, eq, gte, inArray } from "drizzle-orm";

export type FeedPost = Post & {
  userName: string | null;
  userImage: string | null;
  reactions?: Array<{
    id: string | number;
    userId: string;
    emoji?: string;
    imageUrl?: string;
  }>;
};

/**
 * Liefert die aktuellen Feed-Posts inkl. Reaktionen, gefiltert ab dem neuesten Moment-Start (falls vorhanden).
 * Diese Funktion läuft auf dem Server und kapselt alle DB-Queries für die Feed-Seite.
 */
export async function getFeedPosts(limit: number = 50): Promise<FeedPost[]> {
  // Neueste Moment-Startzeit ermitteln
  const latestMoment = await db
    .select({ startDate: moment.startDate })
    .from(moment)
    .orderBy(desc(moment.startDate))
    .limit(1);

  const latestStart = latestMoment[0]?.startDate ?? null;

  const baseQuery = db
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

  const allPosts = latestStart
    ? await baseQuery.where(gte(posts.creationDate, latestStart))
    : await baseQuery;

  // Reaktionen der geladenen Posts holen und den Posts beilegen
  const postIds = allPosts.map((p) => p.id);
  type ReactionForPost = { id: string | number; userId: string; emoji?: string; imageUrl?: string };
  let postsWithReactions = allPosts as (typeof allPosts[number] & { reactions?: ReactionForPost[] })[];

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

    postsWithReactions = allPosts.map((p) => ({
      ...p,
      reactions: grouped.get(p.id)?.map(({ creationDate, ...rest }) => rest) ?? [],
    }));
  }

  return postsWithReactions as FeedPost[];
}
