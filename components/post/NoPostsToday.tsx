import Link from "next/link";
// import { Camera } from "lucide-react";

export default function NoPostsToday() {
  return (
    <div className="flex justify-center py-12 px-4">
      <div className="text-center">
        <p className="text-muted-foreground">
          Es wurde noch nichts heute hochgeladen. Sei der Erste und teile deinen Tag!
        </p>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-2 text-muted-foreground">
          CrewNow zieht um! Erstell dein Crew now doch in
          <Link
            href={process.env.NEXT_PUBLIC_GNAG_HOME_URL ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
          >
            Gnag Home
          </Link>
        </p>

        {/* Previous upload CTA, retained for reference:
        <Link
          href="/create"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          <Camera className="h-4 w-4" />
          CrewNow aufnehmen
        </Link>
        */}
      </div>
    </div>
  );
}
