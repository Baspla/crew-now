"use client";
import { useEffect, useState } from "react";
import Countdown from "../Countdown";
import Link from "next/link";

type Status = {
  timeLeftInWindowSeconds: number | null
};

export default function PostingStatusClient() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/posting-status", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        setStatus({
          timeLeftInWindowSeconds: data?.timeLeftInWindowSeconds ?? null
        });
      } catch {
        // ignore
      }
    };
    load();

    // Refresh lightweight every 10s while visible
    const id = setInterval(load, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

  if (!status) return null;

  const inWindow = (status.timeLeftInWindowSeconds ?? 0) > 0;

  return (
    <div className="flex items-center gap-2 ml-2 md:ml-0">
      {inWindow && (
          <Countdown initialSeconds={status.timeLeftInWindowSeconds ?? 0} />
      )}
    </div>
  );
}
