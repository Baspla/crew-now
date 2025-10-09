"use client";

import React from "react";
import ReactionBubble from "./ReactionBubble";
import Link from "next/link";
import type { UserReaction } from "@/lib/db/schema";
import { reactionEmojis } from "@/lib/reactions";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

interface ReactionEditorProps {
    className?: string;
}

export default function ReactionEditor({ className = "" }: ReactionEditorProps) {
    const trpc = useTRPC();
    const listQuery = useQuery(trpc.userReactions.listMine.queryOptions());
    const userReactions: UserReaction[] = listQuery.data ?? [];

    const lastReactionByEmoji = React.useMemo(() => {
        const map = new Map<string, UserReaction>();
        for (const r of userReactions) {
            if (!map.has(r.emoji)) map.set(r.emoji, r);
        }
        return map;
    }, [userReactions]);
    return (
        <div className={`${className}`} aria-label="Reaktionen">
            <div role="region">
                <div className="flex justify-evenly">
                    {reactionEmojis.map((emoji) => {
                        const r = lastReactionByEmoji.get(emoji);
                        const imageUrl = r?.imageUrl || undefined;
                        const href = `/reactions`;
                        return (
                            <Link
                                key={`editor-${emoji}-${imageUrl ?? 'noimg'}`}
                                href={href}
                                aria-label={`Reaktionen ${emoji}`}
                            >
                                <ReactionBubble
                                    emoji={emoji}
                                    imageUrl={imageUrl}
                                    selected={undefined}
                                    size="lg"
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
