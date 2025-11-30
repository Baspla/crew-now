import PageHead from "@/components/layout/PageHead";
import { db, moment, posts, users } from "@/lib/db/schema";
import { desc, count, and, gte, lte, isNull, or, eq } from "drizzle-orm";
import Link from "next/link";
import ProfilePicture from "@/components/post/ProfilePicture";

export const dynamic = 'force-dynamic'

export default async function MomentsPage() {
  const rows = await db
    .select({
      momentId: moment.id,
      startDate: moment.startDate,
      endDate: moment.endDate,
      userId: users.id,
      userName: users.name,
      userImage: users.image,
      postCount: count(posts.id)
    })
    .from(moment)
    .leftJoin(posts, and(
      gte(posts.creationDate, moment.startDate),
      or(
        isNull(moment.endDate),
        lte(posts.creationDate, moment.endDate)
      )
    ))
    .leftJoin(users, eq(posts.userId, users.id))
    .groupBy(moment.id, moment.startDate, moment.endDate, users.id, users.name, users.image)
    .orderBy(desc(moment.startDate));

  const momentsMap = new Map<string, {
    id: string;
    startDate: Date;
    endDate: Date | null;
    participants: {
      userId: string;
      name: string | null;
      image: string | null;
      count: number;
    }[];
  }>();

  for (const row of rows) {
    if (!momentsMap.has(row.momentId)) {
      momentsMap.set(row.momentId, {
        id: row.momentId,
        startDate: row.startDate,
        endDate: row.endDate,
        participants: []
      });
    }
    if (row.userId) {
      momentsMap.get(row.momentId)!.participants.push({
        userId: row.userId,
        name: row.userName,
        image: row.userImage,
        count: row.postCount
      });
    }
  }
  
  const allMoments = Array.from(momentsMap.values());

  function wochentag(arg0: number): import("react").ReactNode {
    switch (arg0) {
      case 0:
        return "Sonntag";
      case 1:
        return "Montag";
      case 2:
        return "Dienstag";
      case 3:
        return "Mittwoch";
      case 4:
        return "Donnerstag";
      case 5:
        return "Freitag";
      case 6:
        return "Samstag";
    }
  }

  return (
    <main>
      <PageHead title="Archiv" subtitle="Memories of days gone by" backUrl="/feed" />
      <div>
        {allMoments.length === 0 ? (
          <p>Noch keine Einträge im Archiv vorhanden.</p>
        ) : (
          allMoments.map((momentItem) => (
            <div key={momentItem.id} className="p-4">
              <Link href={`/moments/${momentItem.id}`}>
                <h3 className="text-lg font-semibold hover:underline">{wochentag(new Date(momentItem.startDate).getDay())} der {new Date(momentItem.startDate).toLocaleDateString("de-DE")}</h3>
              </Link>
              <p className="text-sm text-gray-500 mb-3">
                Geschehen um {new Date(momentItem.startDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </p>
              
              <div className="flex flex-wrap gap-3">
                {momentItem.participants.length === 0 ? (
                   <p className="text-sm text-gray-400 italic">Keine Posts</p>
                ) : (
                  momentItem.participants.map((participant) => (
                    <div key={participant.userId} className="relative">
                      <ProfilePicture 
                        src={participant.image || undefined} 
                        alt={participant.name || "User"} 
                        size="md" 
                      />
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white dark:border-zinc-900">
                        {participant.count}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}