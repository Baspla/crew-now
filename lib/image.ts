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
  const uploadsDir = path.join(process.cwd(), "uploads", "posts");
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

export async function processAndSave(
  dataUrl: string,
  maxW = 1500,
  maxH = 2000,
  minW = 280,
  minH = 280
) {
  const buf = dataUrlToBuffer(dataUrl);
  if (!buf) throw new Error("Invalid image data URL");
  
  const maxBytes = 15 * 1024 * 1024;
  if (buf.length > maxBytes) {
    throw new Error("Uploaded image exceeds maximum allowed size of 15MB");
  }

  const uploadsDir = await ensureUploadsDir();
  const filename = `${crypto.randomUUID()}.webp`;
  const outPath = path.join(uploadsDir, filename);

  // Read metadata to determine original size
  const image = sharp(buf).rotate();
  const meta = await image.metadata();
  if (!meta.width || !meta.height) throw new Error("Unable to read image dimensions");

  console.log(`Original image size: ${meta.width}x${meta.height}`);

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
    .webp({ quality: 85 }) // Use WebP for better compression
    .toFile(outPath);

  console.log(`Processed image saved as ${filename} with size ${targetW}x${targetH}`);

  return `/uploads/posts/${filename}`;
}

export async function deleteImage(relativePath: string) {
  if (!relativePath) return;
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  // Construct absolute path. Note: relativePath includes "uploads/posts/..."
  const fullPath = path.join(process.cwd(), cleanPath);
  
  try {
    await fs.promises.unlink(fullPath);
    console.log(`Deleted image: ${fullPath}`);
  } catch (error) {
    console.error(`Failed to delete image at ${fullPath}:`, error);
  }
}

export default { dataUrlToBuffer, ensureUploadsDir, processAndSave, deleteImage };
