import PageHead from "@/components/layout/PageHead";
import PostList from "@/components/post/PostList";
import { getFeedPosts } from "@/lib/feed";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const postsWithReactions = await getFeedPosts(50);
  const session = await auth();

  return (
    <main>
      <PageHead title="Feed" subtitle="Alle Posts im Überblick" />
      <div>
        <PostList posts={postsWithReactions} currentUserId={session?.user?.id} />
      </div>
    </main>
  );
}