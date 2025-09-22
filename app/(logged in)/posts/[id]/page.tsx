import Comment from "@/components/Comment";
import ReactionBubble from "@/components/ReactionBubble";
import { db, posts, users, comments, reactions, userReactions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import PageHead from "@/components/PageHead";
import PostHeader from "@/components/PostHeader";
import Post from "@/components/Post";

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { id: string };
}

export default async function PostPage({ params }: PageProps) {
  const p = await params;
  const postId = p.id;
  
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

  // Get comments for this post
  const postComments = await db
    .select({
      id: comments.id,
      content: comments.content,
      creationDate: comments.creationDate,
      userId: comments.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.creationDate));

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
        <Post post={post} userName={post.userName} userImage={post.userImage} />
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
      <div className="mt-8">
        <h3 className="text-lg font-bold mb-4">Kommentare 
          <span className="text-sm font-bold text-gray-500 ml-2">{postComments.length}</span>
        </h3>
        <div className="space-y-4">
          {postComments.length === 0 ? (
            <p className="text-gray-500">Noch keine Kommentare.</p>
          ) : (
            postComments.map((comment) => (
              <Comment
                key={comment.id}
                id={comment.id}
                content={comment.content}
                creationDate={comment.creationDate}
                userId={comment.userId}
                userName={comment.userName}
                userImage={comment.userImage}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}