"use server";

import { auth } from "@/auth";
import { db, posts } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import { processAndSave } from "@/lib/image";
import { postsRemainingForUser } from "@/lib/postingRules";

export async function createPost(formData: FormData) {
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

    const newPost = await db.insert(posts).values({
        imageUrl: savedImageUrl,
        frontImageUrl: savedFrontImageUrl,
        caption: caption,
        userId: userId,
    }).returning();

    redirect(`/posts/${newPost[0].id}`);
}