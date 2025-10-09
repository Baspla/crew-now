import PageHead from "@/components/layout/PageHead";
import PostList from "@/components/post/PostList";
import { getFeedPosts } from "@/lib/feed";

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const postsWithReactions = await getFeedPosts(50);

  return (
    <main>
      <PageHead title="Feed" subtitle="Alle Posts im Überblick" />
      <div>
        <PostList posts={postsWithReactions} />
      </div>
    </main>
  );
}