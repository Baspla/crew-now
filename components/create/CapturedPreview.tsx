"use client";

import PostImage from "@/components/post/PostImage";
import { FormEvent, useMemo, useState } from "react";

interface Props {
  backCameraImage: string;
  frontCameraImage: string | null;
  captionText: string;
  setCaptionText: (v: string) => void;
  onSubmit: (fd: FormData) => Promise<void>;
  retake: () => void;
  postsRemaining: number | null;
}

export default function CapturedPreview({
  backCameraImage,
  frontCameraImage,
  captionText,
  setCaptionText,
  onSubmit,
  retake,
  postsRemaining,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Erzeuge eine stabile UUID für diesen Captured-Durchlauf
  const postId = useMemo(() => crypto.randomUUID(), []);
  const handleForm = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // Füge die Idempotenz-ID hinzu
    fd.set("postId", postId);
    try {
      setIsSubmitting(true);
      await onSubmit(fd);
    } catch (err) {
      // Bei Fehlern UI wieder entsperren
      setIsSubmitting(false);
      // Optional: Fehlerbehandlung/Toast könnte hier erfolgen
      throw err;
    }
  };
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Vorschau</h3>
      <div className="flex justify-center">
        <PostImage
          imageUrl={backCameraImage}
          frontImageUrl={frontCameraImage || undefined}
          alt="Aufgenommener Post"
          className="max-w-md"
          overlayPosition="top-right"
          overlaySize="medium"
        />
      </div>
      <div>
        <label htmlFor="caption" className="block font-semibold mb-2">Bildunterschrift (optional):</label>
        <textarea
          id="caption"
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          rows={3}
          placeholder="Beschreiben Sie Ihr Bild..."
          className="w-full p-3 rounded-lg border border-gray-300 text-sm resize-vertical focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex space-x-3">
        <form onSubmit={handleForm} className="flex-1">
          {/* Hidden Felder für Bilder */}
          <input type="hidden" name="imageUrl" value={backCameraImage} />
            {frontCameraImage && <input type="hidden" name="frontImageUrl" value={frontCameraImage} />}
          <input type="hidden" name="caption" value={captionText} />
          <input type="hidden" name="postId" value={postId} />
          <button
            type="submit"
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white border-0 rounded-lg cursor-pointer text-base transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={(postsRemaining !== null && postsRemaining <= 0) || isSubmitting}
          >
            {isSubmitting ? "Senden..." : "Post senden"}
          </button>
        </form>
        <button
          type="button"
          onClick={retake}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white border-0 rounded-lg cursor-pointer transition-colors font-semibold"
        >
          Neu aufnehmen
        </button>
      </div>
    </div>
  );
}
