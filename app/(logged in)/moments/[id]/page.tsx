import PageHead from "@/components/layout/PageHead";
import PostList from "@/components/post/PostList";
import { db, moment, posts, users } from "@/lib/db/schema";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import Link from "next/link";

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MomentPage({ params }: PageProps) {
  const { id: momentId } = await params;
  
  // Get the moment details
  const momentData = await db
    .select()
    .from(moment)
    .where(eq(moment.id, momentId))
    .get();

  if (!momentData) {
    return (
      <main>
        <PageHead title="Moment nicht gefunden" backUrl="/moments" />
      </main>
    );
  }

  // Get all posts during this moment
  const postsInMoment = await db
    .select({
      id: posts.id,
      imageUrl: posts.imageUrl,
      frontImageUrl: posts.frontImageUrl,
      caption: posts.caption,
      creationDate: posts.creationDate,
      userId: posts.userId,
      userName: users.name,
      userImage: users.image,
    })
    .from(posts)
    .leftJoin(users, eq(posts.userId, users.id))
    .where(
      momentData.endDate
        ? and(
            gte(posts.creationDate, momentData.startDate),
            lte(posts.creationDate, momentData.endDate)
          )
        : gte(posts.creationDate, momentData.startDate)
    )
    .orderBy(desc(posts.creationDate));

  return (
    <main>
      <PageHead title={`Rückblick zum ${new Date(momentData.startDate).toLocaleDateString("de-DE")}`} subtitle="Once upon a time..." backUrl="/moments" />
      
      <div className="mb-8">
        <p><strong>Startzeit: </strong> {new Date(momentData.startDate).toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit" })}</p>
        <p><strong>Anzahl Posts:</strong> {postsInMoment.length}</p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Posts an diesem Tag</h2>
      
      <PostList posts={postsInMoment} />
    </main>
  );
}