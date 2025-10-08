"use client";
import ReactionBubble from "./ReactionBubble";
import { AnimatePresence, motion } from "motion/react"
import React from "react";
import type { UserReaction } from "@/lib/db/schema";
import { reactionEmojis } from "@/lib/reactions";
import { getUserReactions } from "@/app/(logged in)/reactions/actions";
import { useRouter } from "next/navigation";

export default function ReactionPicker({ onClose, reactionPickerOpen, onClick }: { onClose?: () => void, reactionPickerOpen: boolean, onClick: (reactionId: string) => void }) {
    const [userReactions, setUserReactions] = React.useState<UserReaction[]>([]);
    const router = useRouter();

    React.useEffect(() => {
        (async () => {
            try {
                const reactions = await getUserReactions();
                setUserReactions(Array.isArray(reactions) ? reactions : []);
            } catch {
                setUserReactions([]);
            }
        })();
    }, []);

    const lastReactionByEmoji = React.useMemo(() => {
        const map = new Map<string, UserReaction>();
        for (const r of userReactions) {
            if (!map.has(r.emoji)) map.set(r.emoji, r);
        }
        return map;
    }, [userReactions]);
    return (
        <AnimatePresence>
            {reactionPickerOpen && (
                <motion.div className="absolute inset-0 flex flex-col justify-end z-[1000] overflow-hidden">
                    <div
                        className="flex-1 w-full"
                        onClick={onClose}
                    />
                    <motion.div
                        className="flex justify-around px-6 items-center py-6 rounded-t-2xl bg-gradient-to-t from-black to-transparent"
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {reactionEmojis.map((emoji) => {
                            const r = lastReactionByEmoji.get(emoji);
                            const imageUrl = r?.imageUrl || undefined;
                            return (
                                <motion.button
                                    key={`picker-${emoji}-${imageUrl ?? 'noimg'}`}
                                    className="bg-none border-none cursor-pointer flex flex-col items-center"
                                    whileHover={{ scale: 1.06, y: -2 }}
                                    whileTap={{ scale: 0.9, y: 2 }}
                                >
                                    <ReactionBubble
                                        emoji={emoji}
                                        imageUrl={imageUrl}
                                        selected={undefined}
                                        size="lg"
                                        onClick={(e) => {
                                            if (r && r.id) onClick(r.id);
                                            else router.push('/reactions');
                                        }}
                                        interactive
                                    />
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}