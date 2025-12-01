import { db, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import DateDisplay from "@/components/DateDisplay";
import PageHead from "@/components/layout/PageHead";
import Post from "@/components/post/Post";
import { getUserPosts } from "@/lib/feed";
import ProfileSection from "@/components/profile/ProfileSection";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id: userId } = await params;
  const session = await auth();

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

      <ProfileSection
        name={user.name}
        image={user.image}
        totalPosts={userPosts.length}
        streakLength={user.streakLength}
      />

      <h2 className="text-lg font-bold mt-4 mb-4">Posts von {user.name || "diesem Benutzer"}
        <span className="text-md font-bold text-gray-500 ml-2">{userPosts.length}</span>
      </h2>

      <div className="space-y-6 px-4">
        {userPosts.length === 0 ? (
          <p>Noch keine Posts vorhanden.</p>
        ) : (
          userPosts.map((post) => (
            <div key={post.id} className="mb-12">
              <Post post={post} link={true} userName={user.name} userImage={user.image || undefined} currentUserId={session?.user?.id} />

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