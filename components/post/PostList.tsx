import React from "react";
import Post, { PostWithReactions } from "@/components/post/Post";
import type { Post as DBPost } from "@/lib/db/schema";

type ExtendedPost = PostWithReactions & {
  userName?: string | null;
  userImage?: string | null;
};

interface PostListProps {
  posts: ExtendedPost[];
}

export default function PostList({ posts }: PostListProps) {
  if (!posts || posts.length === 0) {
    return <p>Noch keine Posts vorhanden.</p>;
  }

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="pb-6 mb-6 flex justify-center">
          <Post post={post} userName={post.userName} userImage={post.userImage} link />
        </div>
      ))}
    </>
  );
}
