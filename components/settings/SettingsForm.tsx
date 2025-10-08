
"use client"
import { SettingsDTO, updateSettingsAction } from "@/app/(logged in)/settings/actions";
import { useEffect, useRef, useState } from "react";
import { NotificationSlider } from "./NotificationSlider";

export default function SettingsForm({ initial }: { initial: SettingsDTO | null }) {
    // Track current level and last saved level to determine dirty state reliably
    const [level, setLevel] = useState<number>(initial?.emailNotificationsLevel ?? 0);
    const [savedLevel, setSavedLevel] = useState<number>(initial?.emailNotificationsLevel ?? 0);
    const [dirty, setDirty] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        // Compare against the last saved level instead of the initial prop
        setDirty(level !== savedLevel);
    }, [level, savedLevel]);

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

    async function onSubmit(formData: FormData) {
        try {
            setIsSaving(true);
            await updateSettingsAction(formData);
            // On success, update the baseline and clear dirty state
            setSavedLevel(level);
            setDirty(false);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form action={onSubmit} ref={formRef} className="space-y-6" aria-busy={isSaving}>
            <section aria-labelledby="settings-notifications">
                <h2 id="settings-notifications-heading" className="text-lg font-semibold">
                    Benachrichtigungen
                </h2>
                <section aria-labelledby="settings-notifications-email" className="mt-4">
                    <h3 id="settings-notifications-email" className="text-md font-medium">
                        E-Mail Benachrichtigungen
                    </h3>
                    <div className="mt-2">
                        <NotificationSlider
                            initialLevel={initial?.emailNotificationsLevel ?? 0}
                            value={level}
                            onLevelChange={setLevel}
                            name="emailNotificationsLevel"
                            disabled={isSaving}
                        />
                    </div>
                </section>
            </section>

            <div className="flex items-center gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                    disabled={!dirty || isSaving}
                    aria-disabled={!dirty || isSaving}
                >
                    {isSaving ? "Speichern..." : "Speichern"}
                </button>
                {isSaving ? (
                    <span className="text-sm text-muted-foreground" role="status">
                        Wird gespeichert...
                    </span>
                ) : dirty ? (
                    <span className="text-sm text-muted-foreground" role="status">
                        Du hast ungespeicherte Änderungen
                    </span>
                ) : null}
            </div>
        </form>
    );
}