import ReactionBubble from "@/components/post/reactions/ReactionBubble";
import { db, posts, users, reactions, userReactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import PageHead from "@/components/layout/PageHead";
import Post from "@/components/post/Post";
import CommentsSection from "@/components/post/CommentsSection";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { id: postId } = await params;
  const session = await auth();
  
  // Get the post with user data
  const post = await db
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
    .where(eq(posts.id, postId))
    .get();

  if (!post) {
    return (
      <main>
        <h1>Post nicht gefunden</h1>
        <Link href="/feed">← Zurück zum Feed</Link>
      </main>
    );
  }

  // Comments werden clientseitig via tRPC geladen

  // Get reactions for this post
  const postReactions = await db
    .select({
      id: reactions.id,
      creationDate: reactions.creationDate,
      emoji: userReactions.emoji,
      reactionImageUrl: userReactions.imageUrl,
      userId: userReactions.userId,
    })
    .from(reactions)
    .leftJoin(userReactions, eq(reactions.reactionId, userReactions.id))
    .where(eq(reactions.postId, postId))
    .orderBy(desc(reactions.creationDate));

  return (
    <main>
      <PageHead title="Post Details" backUrl="/feed" />

      <div className="mt-6">
        <Post post={post} userName={post.userName} userImage={post.userImage} currentUserId={session?.user?.id} />
      </div>

      {/* Reactions Section */}
      {postReactions.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">GnagMojis 
            <span className="text-sm font-bold text-gray-500 ml-2">{postReactions.length}</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {postReactions.map((reaction) => (
              <ReactionBubble
                key={reaction.id}
                imageUrl={reaction.reactionImageUrl || undefined}
                emoji={reaction.emoji || undefined}
                size="md"
                selected={undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* Comments Section */}
      <CommentsSection postId={postId} currentUserId={session?.user?.id} />
    </main>
  );
}