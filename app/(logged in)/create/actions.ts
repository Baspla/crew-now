"use server";

import { auth } from "@/auth";
import { db, posts } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { processAndSave } from "@/lib/image";
import { postsRemainingForUser } from "@/lib/postingRules";
import { notifyNewPost } from "@/lib/notifications";
import { eq } from "drizzle-orm";

export async function createPost(formData: FormData) {
    const providedPostId = formData.get("postId") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;
    const frontImageUrl = formData.get("frontImageUrl") as string | null;
    const caption = (formData.get("caption") as string | null) || null;
    const session = await auth();
    const userId = session?.user?.id;

    // Basic validations
    if (!userId) {
        throw new Error("User must be logged in to create a post");
    }

    // Enforce posting rules on the server
    const remaining = postsRemainingForUser(userId);
    if (remaining <= 0) {
        throw new Error("Du hast dein Posting-Limit für Heute erreicht.");
    }

    if (!imageUrl) {
        throw new Error("Back camera image is required");
    }

    if (caption && caption.length > 80) {
        throw new Error("Caption must be 80 characters or less");
    }

    // Process required back image (imageUrl is guaranteed above)
    const savedImageUrl = await processAndSave(imageUrl);

    // Process optional front image if provided
    let savedFrontImageUrl: string | null = null;
    if (frontImageUrl) {
        savedFrontImageUrl = await processAndSave(frontImageUrl);
    }

    // Wähle die zu verwendende Post-ID (Client kann liefern, sonst neu erzeugen)
    const postId = providedPostId ?? crypto.randomUUID();

    try {
        // Insert mit expliziter ID; PK verhindert Doppelanlage bei Retry/Duplikat
        const newPost = await db
            .insert(posts)
            .values({
                id: postId,
                imageUrl: savedImageUrl,
                frontImageUrl: savedFrontImageUrl,
                caption: caption,
                userId: userId,
            })
            .returning();

        // Versende Benachrichtigung für "Neue Posts" (opt-in) an andere
        try {
            const sessionUserName = session?.user?.name ?? null
            await notifyNewPost(newPost[0].id, userId, sessionUserName)
        } catch (e) {
            console.error('Failed to send new-post notifications', e)
        }

        redirect(`/posts/${newPost[0].id}`);
    } catch (err: unknown) {
        const isUnique = err instanceof Error && /UNIQUE|PRIMARY KEY/i.test(err.message);
        if (isUnique) {
            // Bereits vorhanden – prüfe optional, ob der Post dem Nutzer gehört
            const existing = await db
                .select()
                .from(posts)
                .where(eq(posts.id, postId))
                .all();
            const found = existing?.[0];
            if (found) {
                // Optionaler Guard: Nur redirecten, wenn derselbe Nutzer
                if (found.userId !== userId) {
                    throw new Error("Konflikt: Post-ID bereits vergeben.");
                }
                redirect(`/posts/${postId}`);
            }
            // Falls nicht gefunden, gib generischen Fehler aus
            throw new Error("Der Post existiert bereits.");
        }
        throw err;
    }
}