import { auth } from "@/auth";
import PageHead from "@/components/layout/PageHead";
import ProfilePicture from "@/components/post/ProfilePicture";
import ReactionEditor from "@/components/post/reactions/ReactionEditor";
import { db, posts, users } from "@/lib/db/schema";
import { eq, count, desc } from "drizzle-orm";
import PostList from "@/components/post/PostList";
import { getUserPosts } from "@/lib/feed";

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
      <section className="pb-8 pt-4 px-4" aria-labelledby="profile-heading">
        <div className="space-y-2">

          {/* Profilbild - zentriert und rund */}
          <div className="flex justify-center">
            <ProfilePicture
              src={userData?.image || user.image || undefined}
              alt={`Profilbild von ${userData?.name || user.name || 'Benutzer'}`}
              size="xl"
            />
          </div>

          {/* Name - zentriert */}
          <div className="text-center">
            <h1
              id="profile-heading"
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              {userData?.name || user.name || 'Unbekannter Benutzer'}
            </h1>
          </div>

          {/* Statistiken - zentriert und aufgeteilt */}
          <div className="flex justify-center">
            <div
              className="flex divide-x divide-gray-300 dark:divide-gray-600"
              role="region"
              aria-label="Profil-Statistiken"
            >
              <div className="px-4 text-center">
                <div
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                  aria-label={`${totalPosts} Bilder insgesamt`}
                >
                  {totalPosts}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Bilder
                </div>
              </div>
              <div className="px-4 text-center">
                <div
                  className="text-xl font-semibold text-gray-900 dark:text-white"
                  aria-label={`${userData?.streakLength || 0} Tage Streak`}
                >
                  {userData?.streakLength || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Streak
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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

          <PostList posts={userPosts} />
      </section>
    </main>
  );
}