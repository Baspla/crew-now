import PageHead from "@/components/layout/PageHead";
import { db, moment, posts } from "@/lib/db/schema";
import { desc, count, countDistinct, and, gte, lte, isNull, or } from "drizzle-orm";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default async function MomentsPage() {
  const allMoments = await db
    .select({
      id: moment.id,
      startDate: moment.startDate,
      endDate: moment.endDate,
      postCount: count(posts.id),
      participantCount: countDistinct(posts.userId)
    })
    .from(moment)
    .leftJoin(posts, and(
      gte(posts.creationDate, moment.startDate),
      or(
        isNull(moment.endDate),
        lte(posts.creationDate, moment.endDate)
      )
    ))
    .groupBy(moment.id, moment.startDate, moment.endDate)
    .orderBy(desc(moment.startDate));

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
      <PageHead title="Tage" subtitle="Memories of days gone by" backUrl="/feed" />
      <div>
        {allMoments.length === 0 ? (
          <p>Noch keine Tage vorhanden.</p>
        ) : (
          allMoments.map((momentItem) => (
            <div key={momentItem.id} className="mb-4 p-4">
              <Link href={`/moments/${momentItem.id}`}>
                <h3 className="text-lg font-semibold">{wochentag(new Date(momentItem.startDate).getDay())} der {new Date(momentItem.startDate).toLocaleDateString("de-DE")}</h3>
              </Link>
              <p className="text-sm text-gray-500">
                Geschehen um {new Date(momentItem.startDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
              </p>
                <p className="">
                Es wurde{momentItem.postCount === 1 ? "" : "n"} {momentItem.postCount} Post{momentItem.postCount === 1 ? "" : "s"} von {momentItem.participantCount} Person{momentItem.participantCount === 1 ? "" : "en"} geteilt
                </p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}