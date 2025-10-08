import { auth } from "@/auth";
import PageHead from "@/components/layout/PageHead";

export default async function SettingsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return (
            <main>
                <PageHead title="Einstellungen" subtitle="Verwalte deine Kontoeinstellungen" backUrl="/feed" />
                <div className="text-center p-4">
                    <p>Nicht angemeldet</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <PageHead title="Einstellungen" subtitle="Verwalte deine Kontoeinstellungen" backUrl="/feed" />
            <section className="p-4" aria-labelledby="settings-notifications-heading">
                <h2 id="settings-notifications-heading" className="text-lg font-semibold">
                    Benachrichtigungen
                </h2>
                <p className="mt-2">
                </p>
            </section>
        </main>
    );
}