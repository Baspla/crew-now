import { db, posts, users, moment } from "@/lib/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import PageHead from "@/components/layout/PageHead";
import PostList from "@/components/post/PostList";

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
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
    .limit(50);

  const allPosts = latestStart
    ? await baseQuery.where(gte(posts.creationDate, latestStart))
    : await baseQuery;

  return (
    <main>
      <PageHead title="Feed" subtitle="Alle Posts im Überblick" />
      <div>
        <PostList posts={allPosts} />
      </div>
    </main>
  );
}