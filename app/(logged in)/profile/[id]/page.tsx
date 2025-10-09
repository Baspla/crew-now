import { db, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import ProfilePicture from "@/components/post/ProfilePicture";
import DateDisplay from "@/components/DateDisplay";
import PostImage from "@/components/post/PostImage";
import UserLink from "@/components/post/UserLink";
import PageHead from "@/components/layout/PageHead";
import Post from "@/components/post/Post";
import { getUserPosts } from "@/lib/feed";

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id: userId } = await params;

  // Get user data
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .get();

  if (!user) {
    return (
      <main>
        <PageHead title="Benutzer nicht gefunden" backUrl="/feed" subtitle="Dieser Benutzer existiert nicht." />
      </main>
    );
  }

  // Get user's posts inkl. Reaktionen
  const userPosts = await getUserPosts(userId, 100);

  return (
    <main>
      <PageHead title={user.name + "'s Profil"} backUrl="/feed" subtitle="Peak content coming up!" />

      <div>
        <div className="flex flex-row gap-4 mb-4">
          <ProfilePicture
            src={user.image || undefined}
            alt="User Avatar"
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold"
            >{user.name}</h1>
            <div>
              <div>
                <strong>Streak:</strong> {user.streakLength} Tage
              </div>
              <div>
                <strong>Mitglied seit:</strong> {user.creationDate.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>


      </div>

      <h2 className="text-lg font-bold mt-8 mb-4">Posts von {user.name || "diesem Benutzer"}
        <span className="text-md font-bold text-gray-500 ml-2">{userPosts.length}</span>
      </h2>

      <div className="space-y-6">
        {userPosts.length === 0 ? (
          <p>Noch keine Posts vorhanden.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="mb-12">
              <Post post={post} link={true} userName={user.name} userImage={user.image || undefined} />

              <div>
                <DateDisplay date={post.creationDate} />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}