"use client";

const gnagHomeUrl = process.env.NEXT_PUBLIC_GNAG_HOME_URL ?? "#";

interface Props {
  onActivate: () => void | Promise<void>;
  postsRemaining: number | null;
  disabled?: boolean;
}

export default function ActivateCameraStep({ onActivate, postsRemaining, disabled }: Props) {
  // const noPostsLeft = postsRemaining !== null && postsRemaining <= 0;
  const noPostsLeft = false; // Limit temporarily lifted
  return (
    <div className="flex flex-col items-center gap-6 py-10">
      <div className="text-center max-w-md space-y-2">
        <h2 className="text-xl font-semibold">Bereit ein neues Bild zu machen?</h2>
        {/* Limit temporarily lifted
        {noPostsLeft ? (
          <p className="text-sm text-red-500 font-medium mt-2">
            Du hast dein Posting-Limit für heute erreicht.
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Du hast noch {postsRemaining ? postsRemaining : "einige"} Posts heute übrig.
          </p>
        )}
        */}
      </div>
      <a
        href={gnagHomeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="px-8 py-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-md transition-colors"
      >
        Gnag Home öffnen
      </a>
      <button
        type="button"
        onClick={() => onActivate()}
        disabled={disabled || noPostsLeft}
        className="px-5 py-2.5 rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-300 disabled:text-zinc-400 dark:disabled:text-zinc-600 font-medium text-sm transition-colors"
      >
        Kamera aktivieren
      </button>
      <div className="text-xs text-zinc-400 max-w-xs text-center">
        Manchmal braucht es kurz oder du musst die Kamera wechseln bis es klappt.
      </div>
    </div>
  );
}
