export default function Caption({ caption }: { caption: string | null }) {
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