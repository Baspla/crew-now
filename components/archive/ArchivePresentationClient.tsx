"use client";

import { MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type PresentationPost = {
  id: string;
  imageUrl: string;
  frontImageUrl?: string | null;
  creationDate: string;
  userId: string;
};

type RangeKey = "1m" | "3m" | "6m" | "1y";

const RANGE_CONFIG: { key: RangeKey; label: string; months: number }[] = [
  { key: "1m", label: "Letzter Monat", months: 1 },
  { key: "3m", label: "Letzte 3 Monate", months: 3 },
  { key: "6m", label: "Letzte 6 Monate", months: 6 },
  { key: "1y", label: "Letztes Jahr", months: 12 },
];

interface ArchivePresentationClientProps {
  posts: PresentationPost[];
  musicSrc: string | null;
  currentUserId: string | null;
}

export default function ArchivePresentationClient({ posts, musicSrc, currentUserId }: ArchivePresentationClientProps) {
  const [selectedRange, setSelectedRange] = useState<RangeKey | null>(null);
  const [scope, setScope] = useState<"me" | "all">("all");
  const [holdSeconds, setHoldSeconds] = useState(2);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const slideshowRef = useRef<HTMLDivElement | null>(null);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());

  const getPostsForSelection = useCallback((range: RangeKey, nextScope: "me" | "all") => {
    const config = RANGE_CONFIG.find((entry) => entry.key === range);
    if (!config) return [];

    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - config.months);

    return posts.filter((post) => {
      const isInRange = new Date(post.creationDate) >= threshold;
      if (!isInRange) return false;
      if (nextScope === "all") return true;
      return !!currentUserId && post.userId === currentUserId;
    });
  }, [currentUserId, posts]);

  const filteredPosts = useMemo(() => {
    if (!selectedRange) return [];
    return getPostsForSelection(selectedRange, scope);
  }, [getPostsForSelection, scope, selectedRange]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev >= filteredPosts.length - 1) {
        return prev;
      }
      return prev + 1;
    });
  }, [filteredPosts.length]);

  const togglePlayback = useCallback(() => {
    if (filteredPosts.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const isAtEnd = currentIndex >= filteredPosts.length - 1;
    if (isAtEnd) {
      setCurrentIndex(0);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }

    setIsPlaying(true);
  }, [currentIndex, filteredPosts.length, isPlaying]);

  const startWithRange = useCallback((range: RangeKey) => {
    setSelectedRange(range);
    const nextPosts = getPostsForSelection(range, scope);

    setCurrentIndex(0);
    setIsPlaying(nextPosts.length > 0);
  }, [getPostsForSelection, scope]);

  const setScopeMode = useCallback((nextScope: "me" | "all") => {
    setScope(nextScope);

    if (!selectedRange) {
      setCurrentIndex(0);
      return;
    }

    const nextPosts = getPostsForSelection(selectedRange, nextScope);
    setCurrentIndex(0);
    if (nextPosts.length === 0) {
      setIsPlaying(false);
    }
  }, [getPostsForSelection, selectedRange]);

  useEffect(() => {
    if (!isPlaying || filteredPosts.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= filteredPosts.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, holdSeconds * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [filteredPosts.length, holdSeconds, isPlaying]);

  const toggleFullscreen = useCallback(async () => {
    if (!slideshowRef.current) return;

    if (document.fullscreenElement === slideshowRef.current) {
      await document.exitFullscreen();
      return;
    }

    await slideshowRef.current.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "KeyF") {
        event.preventDefault();
        void toggleFullscreen();
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        togglePlayback();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [goToNext, goToPrevious, toggleFullscreen, togglePlayback]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicSrc) return;

    if (isPlaying && filteredPosts.length > 0) {
      void audio.play().catch(() => undefined);
      return;
    }

    audio.pause();
  }, [filteredPosts.length, isPlaying, musicSrc]);

  useEffect(() => {
    if (currentIndex <= filteredPosts.length - 1) return;
    setCurrentIndex(Math.max(filteredPosts.length - 1, 0));
  }, [currentIndex, filteredPosts.length]);

  useEffect(() => {
    if (filteredPosts.length === 0) return;

    const preloadUrl = (url?: string | null) => {
      if (!url || preloadedUrlsRef.current.has(url)) return;
      const img = new Image();
      img.src = url;
      preloadedUrlsRef.current.add(url);
    };

    for (let offset = 1; offset <= 2; offset += 1) {
      const nextPost = filteredPosts[currentIndex + offset];
      if (!nextPost) break;
      preloadUrl(nextPost.imageUrl);
      preloadUrl(nextPost.frontImageUrl);
    }
  }, [currentIndex, filteredPosts]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === slideshowRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const currentPost = filteredPosts[currentIndex] ?? null;

  const handleImageTap = (event: MouseEvent<HTMLDivElement>) => {
    if (!currentPost) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left;
    const ratio = relativeX / bounds.width;

    if (ratio < 1 / 3) {
      goToPrevious();
      return;
    }

    if (ratio > 2 / 3) {
      goToNext();
      return;
    }

    togglePlayback();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setScopeMode("me")}
          className={scope === "me"
            ? "rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            : "rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"}
        >
          Ich
        </button>
        <button
          type="button"
          onClick={() => setScopeMode("all")}
          className={scope === "all"
            ? "rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
            : "rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"}
        >
          Alle
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGE_CONFIG.map((entry) => (
          <button
            key={entry.key}
            type="button"
            onClick={() => startWithRange(entry.key)}
            className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            {entry.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-3 text-sm">
        <span>Geschwindigkeit</span>
        <select
          value={holdSeconds}
          onChange={(event) => setHoldSeconds(Number(event.target.value))}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {[1, 2, 3, 4, 5].map((seconds) => (
            <option key={seconds} value={seconds}>
              {seconds} Sekunde{seconds > 1 ? "n" : ""}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={() => void toggleFullscreen()}
        className="rounded-md bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {isFullscreen ? "Vollbild beenden" : "Vollbild"}
      </button>

      {selectedRange && filteredPosts.length === 0 ? (
        <p className="text-sm text-zinc-500">Keine Bilder im gewählten Zeitraum gefunden.</p>
      ) : null}

      {currentPost ? (
        <div
          ref={slideshowRef}
          className={isFullscreen ? "flex h-dvh w-dvw flex-col bg-black" : "space-y-2 bg-white p-2 dark:bg-black"}
        >
          <div
            onClick={handleImageTap}
            className={isFullscreen
              ? "relative flex-1 cursor-pointer overflow-hidden bg-black"
              : "relative mx-auto max-h-[75vh] cursor-pointer overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900"}
          >
            <img
              src={currentPost.imageUrl}
              alt="Archivbild"
              className={isFullscreen ? "h-full w-full object-contain" : "mx-auto max-h-[75vh] w-auto object-contain"}
            />
            {currentPost.frontImageUrl ? (
              <img
                src={currentPost.frontImageUrl}
                alt="Overlay-Bild"
                className={isFullscreen
                  ? "absolute right-3 top-3 z-10 max-h-[30dvh] w-[26dvw] max-w-[320px] rounded-lg border-2 border-white object-cover shadow-lg"
                  : "absolute right-3 top-3 z-10 w-28 rounded-lg border-2 border-white object-cover shadow-lg sm:w-36"}
              />
            ) : null}
            {isFullscreen ? (
              <p className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded bg-black/55 px-2 py-1 text-xs text-zinc-200">
                {currentIndex + 1} / {filteredPosts.length} · {isPlaying ? "Playing" : "Paused"}
              </p>
            ) : null}
          </div>
          {!isFullscreen ? (
            <p className="text-center text-sm text-zinc-500">
              {currentIndex + 1} / {filteredPosts.length} · {isPlaying ? "Playing" : "Paused"}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">Wähle einen Zeitraum, um die Präsentation zu starten.</p>
      )}

      {musicSrc ? <audio ref={audioRef} src={musicSrc} loop preload="auto" /> : null}
    </div>
  );
}
