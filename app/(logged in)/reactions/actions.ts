"use server";

import { auth } from "@/auth";
import { db, userReactions } from "@/lib/db/schema";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { desc, eq, and } from "drizzle-orm";

export interface CreateReactionResult {
  success: boolean;
  error?: string;
  reactionId?: string;
}

export async function createReaction(formData: FormData): Promise<CreateReactionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Benutzer muss angemeldet sein" };
    }

    const image = formData.get("image") as File;
    const emoji = formData.get("emoji") as string;

    if (!image || !emoji) {
      return { success: false, error: "Bild und Emoji sind erforderlich" };
    }

    // Validiere Dateigröße (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return { success: false, error: "Datei ist zu groß (max 5MB)" };
    }

    // Validiere Dateityp
    if (!image.type.startsWith("image/")) {
      return { success: false, error: "Nur Bilddateien sind erlaubt" };
    }

    // Erstelle eindeutigen Dateinamen (immer JPG)
    const filename = `${crypto.randomUUID()}.jpg`;

    // Erstelle Uploads-Verzeichnis falls es nicht existiert
    const uploadsDir = join(process.cwd(), "public", "uploads", "reactions");
    await mkdir(uploadsDir, { recursive: true });

    // Speichere (verarbeitetes) Bild
    const filepath = join(uploadsDir, filename);
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Versuche, sharp dynamisch zu importieren und das Bild zu verarbeiten:
    // - Ausgabe: 480x480 JPEG
    // - Verhalten: center-crop; wenn kleiner -> skaliere hoch, damit die kleinere Seite 480 hat, dann crop
    // Implementiert mit sharp.resize(480,480,{fit:'cover',position:'centre'}) which covers both cases.
    let processedBuffer: Buffer;
    try {
      const sharpMod = await import("sharp");
      const sharp = sharpMod.default || sharpMod;

      processedBuffer = await sharp(buffer)
        .resize(480, 480, { fit: "cover", position: "centre" })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (err) {
      // Wenn sharp nicht verfügbar oder ein Fehler auftritt, fallback auf Originalbild (aber immer noch speichern als .jpg wenn möglich)
      console.error("Bildverarbeitung mit sharp fehlgeschlagen, speichere Originalbild:", err);
      processedBuffer = buffer;
    }

    await writeFile(filepath, processedBuffer);
    
    // Relativer Pfad für die Datenbank
    const imageUrl = `/uploads/reactions/${filename}`;

    // Wenn bereits eine Reaktion für diesen Benutzer + Emoji existiert, aktualisiere sie
    const existing = await db
      .select()
      .from(userReactions)
      .where(and(eq(userReactions.userId, userId), eq(userReactions.emoji, emoji)))
      .limit(1);

    if (existing.length > 0) {
      const existingId = existing[0].id;
      await db
        .update(userReactions)
        .set({ imageUrl: imageUrl, creationDate: new Date() as any })
        .where(eq(userReactions.id, existingId));

      return { success: true, reactionId: existingId };
    }

    // Andernfalls neue Reaktion erstellen
    const newReaction = await db.insert(userReactions).values({
      userId: userId,
      imageUrl: imageUrl,
      emoji: emoji,
    }).returning();

    return {
      success: true,
      reactionId: newReaction[0].id,
    };
    
  } catch (error) {
    console.error("Fehler beim Erstellen der Reaktion:", error);
    return { 
      success: false, 
      error: "Unbekannter Fehler beim Erstellen der Reaktion" 
    };
  }
}

// Funktion zum Abrufen von Benutzer-Reaktionen
export async function getUserReactions(userId?: string) {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return [];
    }

    const reactions = await db
      .select()
      .from(userReactions)
      .where(eq(userReactions.userId, targetUserId))
      .orderBy(desc(userReactions.id));

    return reactions;
  } catch (error) {
    console.error("Fehler beim Abrufen der Reaktionen:", error);
    return [];
  }
}

// Funktion zum Löschen einer Reaktion
export async function deleteReaction(reactionId: string): Promise<CreateReactionResult> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return { success: false, error: "Benutzer muss angemeldet sein" };
    }

    // Prüfe ob die Reaktion dem Benutzer gehört
    const reaction = await db
      .select()
      .from(userReactions)
      .where(
        and(eq(userReactions.id, reactionId),
        eq(userReactions.userId, userId))
      )
      .limit(1);

    if (reaction.length === 0) {
      return { success: false, error: "Reaktion nicht gefunden oder gehört nicht dem Benutzer" };
    }

    // Lösche Reaktion aus Datenbank
    await db.delete(userReactions).where(eq(userReactions.id, reactionId));

    return { success: true };

  } catch (error) {
    console.error("Fehler beim Löschen der Reaktion:", error);
    return { 
      success: false, 
      error: "Fehler beim Löschen der Reaktion" 
    };
  }
}