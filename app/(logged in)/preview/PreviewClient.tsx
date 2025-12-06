"use client";

import { useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function PreviewClient() {
    const trpc = useTRPC();
    const [date, setDate] = useState<Date>(() => {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        return d;
    });

    const query = useQuery(trpc.preview.getHashTime.queryOptions({ date: date.getTime() }));

    const handlePrev = () => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() - 1);
        setDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(date);
        newDate.setDate(date.getDate() + 1);
        setDate(newDate);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-4 bg-card p-2 rounded-lg shadow-sm border">
                <button 
                    onClick={handlePrev} 
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    aria-label="Previous day"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-lg min-w-[200px] text-center">
                    {date.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <button 
                    onClick={handleNext} 
                    className="p-2 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                    aria-label="Next day"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {query.isLoading && <div className="animate-pulse">Lade Daten...</div>}
            
            {query.error && (
                <div className="text-destructive bg-destructive/10 p-4 rounded-md">
                    Fehler: {query.error.message}
                </div>
            )}
            
            {query.data && (
                <div className="border p-6 rounded-xl shadow-sm bg-card w-full max-w-md text-center space-y-4">
                    <div>
                        <h2 className="text-sm font-medium text-muted-foreground tracking-wide">Crew Now Zeit um:</h2>
                        <p className="text-3xl font-bold text-primary mt-1">
                            {new Date(query.data.hashTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
