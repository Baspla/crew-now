import { db, posts, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import PageHead from "@/components/PageHead";
import PostList from "@/components/PostList";

export default async function FeedPage() {
  const allPosts = await db
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
    .orderBy(desc(posts.creationDate));

  return (
    <main>
      <PageHead title="Feed" subtitle="Alle Posts im Überblick" />
      <div>
        <PostList posts={allPosts} />
      </div>
    </main>
  );
}