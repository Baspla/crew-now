import { auth } from "@/auth";
import PageHead from "@/components/layout/PageHead";
import { getSettings, updateSettingsAction } from "./actions";
import SettingsForm from "@/components/settings/SettingsForm";
import SignOutButton from "@/components/layout/SignOutButton";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
        return (
            <main>
                <PageHead title="Einstellungen" subtitle="Verwalte deine Kontoeinstellungen" backUrl="/feed" />
                <div className="text-center">
                    <p>Nicht angemeldet</p>
                </div>
            </main>
        );
    }

    const settings = await getSettings();

    return (
        <main className="min-h-screen">
            <PageHead title="Einstellungen" subtitle="Verwalte deine Kontoeinstellungen" backUrl="/feed" />
            <SettingsForm initial={settings} />
            <div className="border-t border-gray-200 dark:border-gray-700 my-6 mx-2" />
            <div className="text-center">
                <SignOutButton className="py-2 px-4 rounded-lg w-full bg-zinc-800 dark:bg-zinc-300 text-zinc-100 dark:text-zinc-900" />
            </div>
        </main>
    );
}