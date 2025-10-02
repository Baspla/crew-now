"use client";

interface Props {
  error: string | null;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: Props) {
  return (
    <div className="text-center p-6">
      <div className="text-red-300 mb-2">
        <div className="text-3xl mb-2 animate-bounce">🤔</div>
        <p className="text-lg font-semibold">Die Kamera will grade nicht</p>
        {error && <p className="text-sm mt-2">{error}</p>}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-6 py-3 text-2xl font-bold text-white cursor-pointer transition-colors hover:text-zinc-300"
      >
        Erneut versuchen
      </button>
    </div>
  );
}
