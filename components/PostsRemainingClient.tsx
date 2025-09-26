"use client";
import { useEffect, useState } from "react";

export default function PostsRemainingClient() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/posting-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setRemaining(typeof data?.postsRemaining === "number" ? data.postsRemaining : null);
      } catch {
        // ignore
      }
    };
    load();
    const id = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (remaining == null) return null;


  return (
    <span className={"ml-1 text-sm font-semibold leading-none text-gray-600 dark:text-gray-400"} title={`Verbleibende Posts: ${remaining}`}>
      · {remaining}
    </span>
  );
}
