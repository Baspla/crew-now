import PageHead from "@/components/layout/PageHead";
import InfiniteScrollFeed from "@/components/post/InfiniteScrollFeed";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const session = await auth();

  return (
    <>
      <PageHead title="Feed" subtitle="Alle Posts im Überblick" />
      <InfiniteScrollFeed currentUserId={session?.user?.id} />
    </>
  );
}