"use client";
import { useEffect, useState } from "react";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Countdown({ initialSeconds, className }: { initialSeconds: number; className?: string }) {
    const [seconds, setSeconds] = useState(Math.max(0, Math.floor(initialSeconds)));

    useEffect(() => {
        setSeconds(Math.max(0, Math.floor(initialSeconds)));
    }, [initialSeconds]);

    useEffect(() => {
        if (seconds <= 0) return;
        const id = setInterval(() => {
            setSeconds((v) => (v > 0 ? v - 1 : 0));
        }, 1000);
        return () => clearInterval(id);
    }, [seconds]);

    const combinedClassName = `${className ?? ""} ${seconds < 20 ? "text-red-500" : ""}`.trim();

    return (
        <span className={combinedClassName} aria-live="polite" title="Zeit verbleibend im Post-Fenster">
            {formatSeconds(seconds)}
        </span>
    );
}
