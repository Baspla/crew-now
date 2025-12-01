
"use client"
import { useEffect, useRef, useState } from "react";
import { useTRPC } from "@/trpc/client";
import type { SettingsDTO } from "@/trpc/routers/settings";
import { useMutation } from "@tanstack/react-query";

export default function SettingsForm({ initial }: { initial: SettingsDTO }) {
    const trpc = useTRPC();
    const [emailNotifyDailyMoment, setEmailNotifyDailyMoment] = useState<boolean>(initial?.emailNotifyDailyMoment ?? false);
    const [emailNotifyNewPosts, setEmailNotifyNewPosts] = useState<boolean>(initial?.emailNotifyNewPosts ?? false);
    const [emailNotifyCheckInReminder, setEmailNotifyCheckInReminder] = useState<boolean>(initial?.emailNotifyCheckInReminder ?? false);
    const [emailCommentScope, setEmailCommentScope] = useState<0 | 1 | 2 | 3>(initial?.emailCommentScope ?? 0);
    const [emailReactionScope, setEmailReactionScope] = useState<0 | 1 | 2>(initial?.emailReactionScope ?? 0);

    const [ntfyNotifyDailyMoment, setNtfyNotifyDailyMoment] = useState<boolean>(initial?.ntfyNotifyDailyMoment ?? false);
    const [ntfyNotifyNewPosts, setNtfyNotifyNewPosts] = useState<boolean>(initial?.ntfyNotifyNewPosts ?? false);
    const [ntfyNotifyCheckInReminder, setNtfyNotifyCheckInReminder] = useState<boolean>(initial?.ntfyNotifyCheckInReminder ?? false);
    const [ntfyCommentScope, setNtfyCommentScope] = useState<0 | 1 | 2 | 3>(initial?.ntfyCommentScope ?? 0);
    const [ntfyReactionScope, setNtfyReactionScope] = useState<0 | 1 | 2>(initial?.ntfyReactionScope ?? 0);
    const [ntfyTopic, setNtfyTopic] = useState<string | null>(initial?.ntfyTopic ?? null);

    const [saved, setSaved] = useState<SettingsDTO | null>(initial);
    const [dirty, setDirty] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const updateMutation = useMutation(trpc.settings.update.mutationOptions());
    const regenerateMutation = useMutation(trpc.settings.regenerateNtfyTopic.mutationOptions());

    useEffect(() => {
        setDirty(
            saved === null ||
            emailNotifyDailyMoment !== (saved?.emailNotifyDailyMoment ?? false) ||
            emailNotifyNewPosts !== (saved?.emailNotifyNewPosts ?? false) ||
            emailNotifyCheckInReminder !== (saved?.emailNotifyCheckInReminder ?? false) ||
            emailCommentScope !== (saved?.emailCommentScope ?? 0) ||
            emailReactionScope !== (saved?.emailReactionScope ?? 0) ||
            ntfyNotifyDailyMoment !== (saved?.ntfyNotifyDailyMoment ?? false) ||
            ntfyNotifyNewPosts !== (saved?.ntfyNotifyNewPosts ?? false) ||
            ntfyNotifyCheckInReminder !== (saved?.ntfyNotifyCheckInReminder ?? false) ||
            ntfyCommentScope !== (saved?.ntfyCommentScope ?? 0) ||
            ntfyReactionScope !== (saved?.ntfyReactionScope ?? 0)
        );
    }, [
        emailNotifyDailyMoment, emailNotifyNewPosts, emailNotifyCheckInReminder, emailCommentScope, emailReactionScope,
        ntfyNotifyDailyMoment, ntfyNotifyNewPosts, ntfyNotifyCheckInReminder, ntfyCommentScope, ntfyReactionScope,
        saved
    ]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    // Also warn on route change via soft navigation (optional, left simple for now)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        try {
            setIsSaving(true);
            await updateMutation.mutateAsync({
                emailNotifyDailyMoment,
                emailNotifyNewPosts,
                emailNotifyCheckInReminder,
                emailCommentScope,
                emailReactionScope,
                ntfyNotifyDailyMoment,
                ntfyNotifyNewPosts,
                ntfyNotifyCheckInReminder,
                ntfyCommentScope,
                ntfyReactionScope,
            });
            // On success, update the baseline and clear dirty state
            const newSaved: SettingsDTO = {
                emailNotifyDailyMoment,
                emailNotifyNewPosts,
                emailNotifyCheckInReminder,
                emailCommentScope,
                emailReactionScope,
                ntfyNotifyDailyMoment,
                ntfyNotifyNewPosts,
                ntfyNotifyCheckInReminder,
                ntfyCommentScope,
                ntfyReactionScope,
                currentEmail: initial?.currentEmail ?? null,
                ntfyTopic: ntfyTopic,
                ntfyServer: initial?.ntfyServer ?? null,
            };
            setSaved(newSaved);
            setDirty(false);
        } finally {
            setIsSaving(false);
        }
    }

    async function onRegenerateTopic() {
        if (!confirm("Möchtest du wirklich einen neuen Topic-Namen generieren? Du musst deine Abonnements in der ntfy App aktualisieren.")) return;
        try {
            setIsRegenerating(true);
            const res = await regenerateMutation.mutateAsync();
            setNtfyTopic(res.topic);
        } finally {
            setIsRegenerating(false);
        }
    }

    return (
        <form onSubmit={onSubmit} ref={formRef} className="space-y-6 max-w-2xl" aria-busy={isSaving}>

            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/30 p-3 sm:p-4 text-sm text-zinc-700 dark:text-zinc-300">
                <h4 className="font-semibold mb-2">Wichtig</h4>
                <p className="mb-1">Dein Profilbild, Namen und E-Mail kannst du in <a className="font-semibold text-indigo-800 dark:text-indigo-400" href={process.env.NEXT_PUBLIC_SSO_URL} target="_blank" rel="noopener noreferrer">GnagPlus</a> ändern.</p>
                <p >Nach der Änderung musst du dich in Crew Now einmal aus- und wieder einloggen.</p>
            </div>
            <section aria-labelledby="settings-notifications" className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/40 backdrop-blur p-4 sm:p-6">
                <h2 id="settings-notifications-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    Benachrichtigungen
                </h2>
                <section aria-labelledby="settings-notifications-email" className="mt-4 space-y-5">
                    <h3 id="settings-notifications-email" className="text-md font-semibold text-zinc-800 dark:text-zinc-200">
                        E-Mail Benachrichtigungen
                    </h3>

                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Aktuelle E-Mail</span>
                            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{initial?.currentEmail ?? '—'}</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="emailNotifyDailyMoment"
                                checked={emailNotifyDailyMoment}
                                onChange={(e) => setEmailNotifyDailyMoment(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Tägliche Postzeit</span>
                        </label>

                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="emailNotifyNewPosts"
                                checked={emailNotifyNewPosts}
                                onChange={(e) => setEmailNotifyNewPosts(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Neue Posts</span>
                        </label>

                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="emailNotifyCheckInReminder"
                                checked={emailNotifyCheckInReminder}
                                onChange={(e) => setEmailNotifyCheckInReminder(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Check-In Reminder</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] items-center gap-3">
                        <label htmlFor="emailCommentScope" className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300">Kommentare</label>
                        <select
                            id="emailCommentScope"
                            name="emailCommentScope"
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            value={emailCommentScope}
                            onChange={(e) => setEmailCommentScope(Number(e.target.value) as 0 | 1 | 2 | 3)}
                            disabled={isSaving}
                        >
                            <option value={0}>Aus</option>
                            <option value={1}>Nur auf deine Posts</option>
                            <option value={2}>Auch unter Posts, wo du kommentiert hast</option>
                            <option value={3}>Alle Kommentare</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] items-center gap-3">
                        <label htmlFor="emailReactionScope" className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300">Reaktionen</label>
                        <select
                            id="emailReactionScope"
                            name="emailReactionScope"
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            value={emailReactionScope}
                            onChange={(e) => setEmailReactionScope(Number(e.target.value) as 0 | 1 | 2)}
                            disabled={isSaving}
                        >
                            <option value={0}>Aus</option>
                            <option value={1}>Reaktionen auf deine Posts</option>
                            <option value={2}>Reaktionen auf alle Posts</option>
                        </select>
                    </div>
                </section>

                <section aria-labelledby="settings-notifications-ntfy" className="mt-8 space-y-5 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 id="settings-notifications-ntfy" className="text-md font-semibold text-zinc-800 dark:text-zinc-200">
                        Ntfy Benachrichtigungen
                    </h3>

                    <div className="mt-2 flex flex-col gap-2">
                        <div>
                            <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Aktueller Topic</span>
                            <div className="flex items-center gap-2 mt-1">
                                <code className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded select-all">
                                    {initial?.ntfyServer && ntfyTopic ? `${initial.ntfyServer}/${ntfyTopic}` : (ntfyTopic || '—')}
                                </code>
                                <button
                                    type="button"
                                    onClick={onRegenerateTopic}
                                    disabled={isRegenerating || isSaving}
                                    className="text-xs px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    {isRegenerating ? '...' : 'Neu generieren'}
                                </button>
                            </div>
                            {initial?.ntfyServer && (
                                <p className="text-xs text-zinc-500 mt-1">
                                    Abonniere diesen Topic in deiner ntfy App auf <strong>{initial.ntfyServer}</strong>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="ntfyNotifyDailyMoment"
                                checked={ntfyNotifyDailyMoment}
                                onChange={(e) => setNtfyNotifyDailyMoment(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Tägliche Postzeit</span>
                        </label>

                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="ntfyNotifyNewPosts"
                                checked={ntfyNotifyNewPosts}
                                onChange={(e) => setNtfyNotifyNewPosts(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Neue Posts</span>
                        </label>

                        <label className="flex select-none items-center gap-3 text-zinc-800 dark:text-zinc-200">
                            <input
                                type="checkbox"
                                name="ntfyNotifyCheckInReminder"
                                checked={ntfyNotifyCheckInReminder}
                                onChange={(e) => setNtfyNotifyCheckInReminder(e.target.checked)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded-sm border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-900 accent-zinc-700 dark:accent-zinc-300 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900"
                            />
                            <span>Check-In Reminder</span>
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] items-center gap-3">
                        <label htmlFor="ntfyCommentScope" className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300">Kommentare</label>
                        <select
                            id="ntfyCommentScope"
                            name="ntfyCommentScope"
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            value={ntfyCommentScope}
                            onChange={(e) => setNtfyCommentScope(Number(e.target.value) as 0 | 1 | 2 | 3)}
                            disabled={isSaving}
                        >
                            <option value={0}>Aus</option>
                            <option value={1}>Nur auf deine Posts</option>
                            <option value={2}>Auch unter Posts, wo du kommentiert hast</option>
                            <option value={3}>Alle Kommentare</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[14rem_1fr] items-center gap-3">
                        <label htmlFor="ntfyReactionScope" className="text-sm sm:text-base text-zinc-700 dark:text-zinc-300">Reaktionen</label>
                        <select
                            id="ntfyReactionScope"
                            name="ntfyReactionScope"
                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 shadow-sm hover:border-zinc-400 dark:hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                            value={ntfyReactionScope}
                            onChange={(e) => setNtfyReactionScope(Number(e.target.value) as 0 | 1 | 2)}
                            disabled={isSaving}
                        >
                            <option value={0}>Aus</option>
                            <option value={1}>Reaktionen auf deine Posts</option>
                            <option value={2}>Reaktionen auf alle Posts</option>
                        </select>
                    </div>
                </section>
            </section>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-zinc-900 text-zinc-100 hover:bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
                    disabled={!dirty || isSaving}
                    aria-disabled={!dirty || isSaving}
                >
                    {isSaving ? "Speichern..." : "Speichern"}
                </button>
                {isSaving ? (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
                        Wird gespeichert...
                    </span>
                ) : dirty ? (
                    <span className="text-sm text-zinc-500 dark:text-zinc-400" role="status">
                        Du hast ungespeicherte Änderungen
                    </span>
                ) : null}
            </div>
        </form>
    );
}