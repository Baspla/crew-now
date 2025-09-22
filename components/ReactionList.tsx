"use client";
import React from "react";
import ReactionBubble from "./ReactionBubble";

type Reaction = {
    id: number | string;
    emoji?: string;
    imageUrl?: string;
};

type Props = {
    reactions?: Reaction[];
    maxVisible?: number;
};

export default function ReactionList({ reactions, maxVisible = 3 }: Props) {
    const [selected, setSelected] = React.useState<number | string | null>(null);

    if (!reactions || reactions.length === 0) {
        return null;
    }

    const visible = reactions.slice(0, maxVisible);
    const extra = reactions.length > maxVisible ? reactions.length - maxVisible : 0;

    return (
        <div className="flex -space-x-4">
            {visible.map((reaction) => (
                <ReactionBubble
                    key={reaction.id}
                    emoji={reaction.emoji ?? ""}
                    imageUrl={reaction.imageUrl}
                    selected={typeof selected === "number" || typeof selected === "string" ? reaction.id === selected : undefined}
                />
            ))}
            {extra > 0 && (
                <ReactionBubble
                    number={extra}
                    selected={undefined}
                />
            )}
        </div>
    );
}
