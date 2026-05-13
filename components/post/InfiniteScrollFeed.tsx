"use client";

import React, { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import Post from "@/components/post/Post";
import DateDivider from "@/components/post/DateDivider";
import NoPostsToday from "@/components/post/NoPostsToday";
import type { FeedPost } from "@/lib/feed";

interface InfiniteScrollFeedProps {
  currentUserId?: string;
}

/**
 * Returns the start of the day (00:00:00) for a given date
 */
function startOfDay(date: Date): Date {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
}

export default function InfiniteScrollFeed({ currentUserId }: InfiniteScrollFeedProps) {
  const trpc = useTRPC();
  const observerTarget = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, error } = useInfiniteQuery({
    queryKey: ["posts", "feed", "infinite"],
    queryFn: async ({ pageParam }: { pageParam?: Date }) => {
      return await (trpc.posts.feedInfinite as any)({
        limit: 20,
        cursor: pageParam,
      });
    },
    getNextPageParam: (lastPage: any) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as Date | undefined,
  });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (status === "pending") {
    return (
      <div className="flex justify-center py-12">
        <p className="text-muted-foreground">Lädt Posts...</p>
      </div>
    );
  }

  if (status === "error" || error) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-destructive">Fehler beim Laden der Posts</p>
      </div>
    );
  }

  // Flatten all posts from pages
  const allPosts: FeedPost[] = [];
  data?.pages.forEach((page: any) => {
    allPosts.push(...(page.items || []));
  });

  if (allPosts.length === 0) {
    return <NoPostsToday />;
  }

  // Group posts by date
  const postsGroupedByDate: { date: Date; posts: FeedPost[] }[] = [];
  const dateMap = new Map<string, FeedPost[]>();

  allPosts.forEach((post) => {
    const dateKey = startOfDay(post.creationDate).toISOString();
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, []);
    }
    dateMap.get(dateKey)!.push(post);
  });

  // Convert to sorted array (newest first)
  const sortedDates = Array.from(dateMap.keys()).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  sortedDates.forEach((dateKey) => {
    postsGroupedByDate.push({
      date: new Date(dateKey),
      posts: dateMap.get(dateKey) || [],
    });
  });

  // Check if today has posts
  const today = startOfDay(new Date());
  const todayKey = today.toISOString();
  const hasTodaysPosts = dateMap.has(todayKey);

  return (
    <main>
      {/* Show "No Posts Today" message if today has no posts */}
      {!hasTodaysPosts && <NoPostsToday />}

      {/* Render grouped posts with date dividers */}
      {postsGroupedByDate.map((group) => (
        <div key={group.date.toISOString()}>
          <DateDivider date={group.date} />
          {group.posts.map((post) => (
            <div key={post.id} className="pb-6 mb-6 flex justify-center">
              <Post
                post={post}
                userName={post.userName}
                userImage={post.userImage}
                link
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Intersection observer target for infinite scroll */}
      <div ref={observerTarget} className="py-8 flex justify-center">
        {isFetchingNextPage && <p className="text-muted-foreground text-sm">Lädt mehr Posts...</p>}
        {!hasNextPage && allPosts.length > 0 && (
          <p className="text-muted-foreground text-sm">Keine weiteren Posts vorhanden</p>
        )}
      </div>
    </main>
  );
}
