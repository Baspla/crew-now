import PageHead from "@/components/layout/PageHead";
import ArchivePresentationClient from "@/components/archive/ArchivePresentationClient";
import { db, posts } from "@/lib/db/schema";
import { asc, gte } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ArchivePresentationPage() {
  const session = await auth();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const rows = await db
    .select({
      id: posts.id,
      imageUrl: posts.imageUrl,
      frontImageUrl: posts.frontImageUrl,
      creationDate: posts.creationDate,
      userId: posts.userId,
    })
    .from(posts)
    .where(gte(posts.creationDate, oneYearAgo))
    .orderBy(asc(posts.creationDate));

  const musicFile = process.env.ARCHIVE_PRESENTATION_MUSIC_FILE?.trim();
  const musicSrc = musicFile
    ? musicFile.startsWith("/uploads/")
      ? musicFile
      : `/uploads/music/${musicFile}`
    : null;

  const postData = rows.map((row) => ({
    id: row.id,
    imageUrl: row.imageUrl,
    frontImageUrl: row.frontImageUrl,
    creationDate: row.creationDate.toISOString(),
    userId: row.userId,
  }));

  return (
    <main>
      <PageHead title="Archiv Slideshow" subtitle="Tippen/Klicken: links/rechts navigieren, Mitte pausieren" backUrl="/moments" />
      <ArchivePresentationClient
        posts={postData}
        musicSrc={musicSrc}
        currentUserId={session?.user?.id ?? null}
      />
    </main>
  );
}
