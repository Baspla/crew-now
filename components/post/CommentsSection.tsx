"use client";
import React from "react";
import Comment from "@/components/post/Comment";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

type CommentRow = {
  id: string;
  content: string;
  creationDate: string | Date;
  userId: string;
  userName: string | null;
  userImage: string | null;
};

export default function CommentsSection({ postId, currentUserId }: { postId: string; currentUserId?: string }) {
  const trpc = useTRPC();

  const commentsQuery = useQuery(trpc.comments.listByPost.queryOptions({ postId }));
  const createMutation = useMutation(trpc.comments.create.mutationOptions());
  const deleteMutation = useMutation(trpc.comments.delete.mutationOptions());

  const [content, setContent] = React.useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { postId, content: trimmed },
      {
        onSuccess: () => {
          setContent("");
          commentsQuery.refetch();
        },
      },
    );
  };

  const onDelete = (id: string) => {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => {
          commentsQuery.refetch();
        },
      },
    );
  };

  const loading = commentsQuery.isLoading;
  const items: CommentRow[] = commentsQuery.data ?? [];

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold mb-4">
        Kommentare
        <span className="text-sm font-bold text-zinc-500 ml-2">{items.length}</span>
      </h3>

      <form onSubmit={onSubmit} className="mb-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-md border dark:border-zinc-600 dark:bg-zinc-800 border-zinc-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Schreibe einen Kommentar..."
            rows={2}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            type="submit"
            disabled={!content.trim() || createMutation.isPending}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {createMutation.isPending ? "Senden..." : "Senden"}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <p className="text-zinc-500">Lade Kommentare...</p>
        ) : items.length === 0 ? (
          <p className="text-zinc-500">Noch keine Kommentare.</p>
        ) : (
          items.map((c) => (
            <Comment
              key={c.id}
              id={c.id}
              content={c.content}
              creationDate={c.creationDate}
              userId={c.userId}
              userName={c.userName}
              userImage={c.userImage}
              canDelete={currentUserId === c.userId}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
