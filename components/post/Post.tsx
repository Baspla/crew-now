"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import PostImage from "@/components/post/PostImage";
import PostHeader from "@/components/post/PostHeader";
import type { Post } from "@/lib/db/schema";
import ReactionButton from "@/components/post/reactions/ReactionButton";
import ReactionList from "@/components/post/reactions/ReactionList";
import ReactionPicker from "@/components/post/reactions/ReactionPicker";
import { AnimatePresence, motion } from "motion/react";
import Caption from "./Caption";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";

interface PostProps {
    post: PostWithReactions;
    link?: boolean;
    userName?: string | null;
    userImage?: string | null;
}

export type PostWithReactions = Post & {
    reactions?: {
        id: number | string;
        userId: string;
        emoji?: string;
        imageUrl?: string;
    }[];
    commentCount?: number;
};

export default function Post({ post, link, userName, userImage }: PostProps) {
    const [reactionPickerOpen, setReactionPickerOpen] = React.useState(false);
    const trpc = useTRPC();
    const router = useRouter();

    const addReaction = useMutation(trpc.reactions.addToPost.mutationOptions());

    useEffect(() => {
        console.log(reactionPickerOpen);
    }, [reactionPickerOpen]);

    return (
        <div className="w-full flex flex-col">
            {userName && userImage && (
            <PostHeader
                userId={post.userId}
                userImage={userImage}
                userName={userName}
                creationDate={post.creationDate}
            />)}
            <PostImage
                imageUrl={post.imageUrl}
                frontImageUrl={post.frontImageUrl}
                alt="Post"
                className="block"
            >
                <AnimatePresence>
                    {!reactionPickerOpen && (
                        // Vertical stack for overlay buttons
                        <>
                            <motion.div className="absolute bottom-4 right-4 flex flex-col gap-2 items-end"
                                initial={{ opacity: 0}}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {link && (
                                    <Link href={`/posts/${post.id}`}>
                                        <button className="w-10 h-10 flex items-center justify-center transition-all duration-200 text-zinc-200 hover:text-zinc-400 cursor-pointer relative">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
                                                <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97-1.94.284-3.916.455-5.922.505a.39.39 0 0 0-.266.112L8.78 21.53A.75.75 0 0 1 7.5 21v-3.955a48.842 48.842 0 0 1-2.652-.316c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z" clipRule="evenodd" />
                                            </svg>
                                            {post.commentCount !== undefined && post.commentCount > 0 && (
                                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-black pb-1">
                                                    {post.commentCount > 9 ? "9+" : post.commentCount}
                                                </span>
                                            )}
                                        </button>
                                    </Link>
                                )}
                                <ReactionButton onClick={() => setReactionPickerOpen(true)} />
                            </motion.div>
                            <motion.div className="absolute bottom-4 left-4"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ReactionList reactions={post.reactions} />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
                <ReactionPicker
                    reactionPickerOpen={reactionPickerOpen}
                    onClose={() => setReactionPickerOpen(false)}
                    onClick={(reactionId) => {
                        addReaction.mutate(
                            { postId: post.id, reactionId },
                            {
                                onSuccess: () => {
                                    // UI aktualisieren – Page neu validieren
                                    router.refresh();
                                    setReactionPickerOpen(false);
                                },
                                onError: (e) => {
                                    console.error('Failed to add reaction', e);
                                },
                            },
                        );
                    }}
                />
            </PostImage>
            {post.caption && (
            <Caption caption={post.caption} />
            )}
        </div>
    );
}

