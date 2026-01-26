import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useRouter } from "next/navigation";

export default function Caption({ caption, isEditing, postId, onCancel }: { caption: string | null, isEditing?: boolean, postId?: string, onCancel?: () => void }) {
    const [text, setText] = useState(caption || "");
    const trpc = useTRPC();
    const router = useRouter();
    const updatePost = useMutation(trpc.posts.update.mutationOptions());

    useEffect(() => {
        setText(caption || "");
    }, [caption]);

    const handleSave = () => {
        if (!postId) return;
        updatePost.mutate({ postId, caption: text }, {
            onSuccess: () => {
                router.refresh();
                if (onCancel) onCancel();
            }
        });
    };

    if (isEditing) {
        return (
             <div className="mt-1 mx-1">
                <textarea
                    className="w-full bg-transparent border border-zinc-700 rounded p-2 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    maxLength={160}
                />
                <div className="flex justify-end gap-2 mt-1">
                    <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Abbrechen</button>
                    <button onClick={handleSave} className="text-xs text-blue-500 hover:text-blue-700 font-bold" disabled={updatePost.isPending}>
                        {updatePost.isPending ? "Speichert..." : "Speichern"}
                    </button>
                </div>
             </div>
        )
    }

    if (!caption) return null;

    const lines = caption.split(/\r\n|\r|\n/);
    const maxLines = 3;
    const isTruncated = lines.length > maxLines;
    const preview = isTruncated ? lines.slice(0, maxLines).join('\n') + '\n' : caption;
    const rest = isTruncated ? lines.slice(maxLines).join('\n') : '';

    if (!isTruncated) {
        return (
            <p className="mt-1 mx-1 text-gray-800 dark:text-gray-200 font-semibold tracking-wide whitespace-pre-wrap">
                {caption}
            </p>
        );
    }

    return (
        <details className="mt-1 mx-1 text-gray-800 dark:text-gray-200 font-semibold tracking-wide">
            <summary className="list-none whitespace-pre-wrap cursor-pointer">
                {preview}
                <span className="text-gray-500">... mehr anzeigen</span>
            </summary>
            <p className="whitespace-pre-wrap">
                {rest}
            </p>
        </details>
    );
}