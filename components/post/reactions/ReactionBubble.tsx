"use client";
import { motion } from "motion/react";

type Size = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

interface ReactionBubbleProps {
    emoji?: string;
    imageUrl?: string;
    selected: boolean | undefined;
    size?: Size;
    number?: number;
    interactive?: boolean;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const sizeClasses = {
    sm: {
        container: 'w-8 h-8',
        emoji: 'text-xs -bottom-0.5 -left-0.5',
        plus: 'text-sm'
    },
    md: {
        container: 'w-10 h-10',
        emoji: 'text-md -bottom-1 -left-1',
        plus: 'text-lg'
    },
    lg: {
        container: 'w-12 h-12 sm:w-18 sm:h-18',
        emoji: 'text-lg sm:text-2xl -bottom-1 -left-1',
        plus: 'text-2xl sm:text-3xl'
    },
    xl: {
        container: 'w-24 h-24',
        emoji: 'text-2xl -bottom-1 -left-1',
        plus: 'text-2xl'
    },
    xxl: {
        container: 'w-40 h-40',
        emoji: 'text-5xl -bottom-2 -left-2',
        plus: 'text-4xl'
    }
};

export default function ReactionBubble({ emoji, imageUrl, selected, size = 'md', number, interactive = false, onClick }: ReactionBubbleProps) {
    const sizeClass = sizeClasses[size];
    const motionProps = interactive
        ? { whileHover: { scale: 1.06 }, whileTap: { scale: 0.9, y: 1 } }
        : {};
    
    const renderPlaceholder = () => {
        if (number !== undefined) {
            return (
                <div
                    className={`${sizeClass.container} rounded-full border-2 border-transparent bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center`}
                />
            );
        }
        return (
            <div
                className={`${sizeClass.container} rounded-full border-2 border-dashed border-zinc-400 cursor-pointer flex items-center justify-center  transition-colors`}
            >
                <span className={`${sizeClass.plus} text-zinc-400`}>+</span>
            </div>
        );
    };

    const renderImage = () => {
        const baseClasses = `${sizeClass.container} rounded-full object-cover border-2 cursor-pointer`;
        
        if (selected === true) {
            return (
                <img
                    src={imageUrl}
                    alt={emoji}
                    className={`${baseClasses} border-white`}
                />
            );
        } else if (selected === false) {
            return (
                <img
                    src={imageUrl}
                    alt={emoji}
                    className={`${baseClasses} border-gray-800 opacity-60`}
                />
            );
        } else {
            return (
                <img
                    src={imageUrl}
                    alt={emoji}
                    className={`${baseClasses} border-transparent`}
                />
            );
        }
    };

    return (
        <motion.div
            className="relative inline-block"
            {...motionProps}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
        >
            {!imageUrl ? renderPlaceholder() : renderImage()}
            {emoji && (
                <span
                    className={`absolute ${sizeClass.emoji} px-1 py-0.5 cursor-pointer`}
                    style={{ lineHeight: 1 }}
                >
                    {emoji}
                </span>
            )}
            {number !== undefined && (
                <span
                    className="absolute inset-0 text-md flex items-center justify-center font-semibold text-zinc-700 dark:text-zinc-300 pointer-events-none"
                    style={{ zIndex: 10 }}
                >
                    +{number}
                </span>
            )}
        </motion.div>
    );
}
