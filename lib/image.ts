import fs from "fs";
import path from "path";
import sharp from "sharp";
import crypto from "crypto";

export const dataUrlToBuffer = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
  if (!matches) return null;
  const b64 = matches[3];
  return Buffer.from(b64, "base64");
};

export async function ensureUploadsDir() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "posts");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

export async function processAndSave(
  dataUrl: string,
  maxW = 1080,
  maxH = 1080,
  minW = 280,
  minH = 280
) {
  const buf = dataUrlToBuffer(dataUrl);
  if (!buf) throw new Error("Invalid image data URL");

  const maxBytes = 10 * 1024 * 1024; // 10 MB
  if (buf.length > maxBytes) {
    throw new Error("Uploaded image exceeds maximum allowed size of 10MB");
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `${crypto.randomUUID()}.jpg`;
  const outPath = path.join(uploadsDir, filename);

  // Read metadata to determine original size
  const image = sharp(buf).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("Unable to read image dimensions");

  let targetW = meta.width;
  let targetH = meta.height;

  // 1) Scale so the largest dimension fits within max while preserving aspect ratio
  const scaleToMax = Math.min(maxW / meta.width, maxH / meta.height, 1);
  targetW = Math.max(1, Math.round(meta.width * scaleToMax));
  targetH = Math.max(1, Math.round(meta.height * scaleToMax));

  // 2) If the other dimension falls below the min, set it to min
  if (targetW < minW) targetW = minW;
  if (targetH < minH) targetH = minH;

  await image
    .resize(targetW, targetH, { fit: "cover", position: "centre" })
    .jpeg({ quality: 82 })
    .toFile(outPath);

  return `/uploads/posts/${filename}`;
}

export default { dataUrlToBuffer, ensureUploadsDir, processAndSave };
