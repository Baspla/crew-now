import Link from "next/link";
import { Camera } from "lucide-react";

export default function NoPostsToday() {
  return (
    <div className="flex justify-center py-12 px-4">
      <div className="text-center">
        <p className="text-muted-foreground">
          Es wurde noch nichts heute hochgeladen. Sei der Erste und teile deinen Tag!
        </p>

        <Link
          href="/create"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:opacity-90"
        >
          <Camera className="h-4 w-4" />
          CrewNow aufnehmen
        </Link>
      </div>
    </div>
  );
}
