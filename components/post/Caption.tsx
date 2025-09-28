export default function Caption({ caption }: { caption: string | null }) {
    if (!caption) return null;
    return <p className="mt-1 mx-1 text-gray-800 dark:text-gray-200 italic">{caption}</p>;
}