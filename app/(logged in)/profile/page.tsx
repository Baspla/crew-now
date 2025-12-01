import { auth } from "@/auth";
import PageHead from "@/components/layout/PageHead";
import ProfilePicture from "@/components/post/ProfilePicture";
import ReactionEditor from "@/components/post/reactions/ReactionEditor";
import { db, posts, users } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import PostList from "@/components/post/PostList";
import { getUserPosts } from "@/lib/feed";
import ProfileSection from "@/components/profile/ProfileSection";

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    return (
      <main>
        <PageHead title="Dein Profil" subtitle="Deine persönlichen Informationen" backUrl="/feed" />
        <div className="text-center p-4">
          <p>Nicht angemeldet</p>
        </div>
      </main>
    );
  }

  // Benutzerdaten aus der Datenbank abrufen
  const [userData] = await db
    .select({
      name: users.name,
      image: users.image,
      streakLength: users.streakLength,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  // Anzahl der Posts abrufen
  const [{ totalPosts }] = await db
    .select({ totalPosts: count() })
    .from(posts)
    .where(eq(posts.userId, user.id));

  // Posts des Benutzers inkl. Reaktionen abrufen
  const userPosts = await getUserPosts(user.id, 100);

  return (
    <main className="min-h-screen">
      <PageHead title="Dein Profil" subtitle="Deine persönlichen Informationen" backUrl="/feed" />

      {/* Profil-Sektion */}
      <ProfileSection
        name={userData?.name || user.name}
        image={userData?.image || user.image}
        totalPosts={totalPosts}
        streakLength={userData?.streakLength}
      />

      {/* ReactionEditor */}
      <section className="px-4 pb-6" aria-label="Reaktionen">
            <ReactionEditor />
      </section>

      {/* Posts Liste */}
      <section className="px-4 pb-8" aria-labelledby="posts-heading">
          <h2
            id="posts-heading"
            className="text-xl font-semibold mb-4 text-gray-900 dark:text-white text-start"
          >
            Deine Posts
          </h2>

          <PostList posts={userPosts} currentUserId={user.id} />
      </section>
    </main>
  );
}