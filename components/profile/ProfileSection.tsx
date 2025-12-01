import ProfilePicture from "@/components/post/ProfilePicture";

type ProfileSectionProps = {
  name: string | null | undefined;
  image?: string | null;
  totalPosts: number;
  streakLength?: number | null;
  headingId?: string;
};

export default function ProfileSection({
  name,
  image,
  totalPosts,
  streakLength = 0,
  headingId = "profile-heading",
}: ProfileSectionProps) {
  const displayName = name || "Unbekannter Benutzer";
  const streak = streakLength || 0;

  return (
    <section className="pb-8 pt-4 px-4" aria-labelledby={headingId}>
      <div className="space-y-2">
        {/* Profilbild - zentriert und rund */}
        <div className="flex justify-center">
          <ProfilePicture
            src={image || undefined}
            alt={`Profilbild von ${displayName}`}
            size="xl"
          />
        </div>

        {/* Name - zentriert */}
        <div className="text-center">
          <h1 id={headingId} className="text-3xl font-bold text-gray-900 dark:text-white">
            {displayName}
          </h1>
        </div>

        {/* Statistiken - zentriert und aufgeteilt */}
        {/*
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
              <div className="text-sm text-gray-600 dark:text-gray-400">Bilder</div>
            </div>
            <div className="px-4 text-center">
              <div
                className="text-xl font-semibold text-gray-900 dark:text-white"
                aria-label={`${streak} Tage Streak`}
              >
                {streak}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Streak</div>
            </div>
          </div>
        </div>
        */}
      </div>
    </section>
  );
}
