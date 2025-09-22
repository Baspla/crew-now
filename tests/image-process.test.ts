import { processAndSave } from "../lib/image";
import fs from "fs";
import path from "path";
import sharp from "sharp";

async function run() {
  // tiny 2x2 red PNG data URL
  const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAEklEQVQImWNgYGD4z8DAwMDAAAANAAH7c0b5AAAAABJRU5ErkJggg==";

  try {
    // Use max 200x100 and min 50x50 to exercise both scaling and cropping logic
    const url = await processAndSave(dataUrl, 200, 100, 50, 50);
    console.log("Saved:", url);
    const file = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    const exists = fs.existsSync(file);
    if (!exists) {
      console.error("Test failed: file not found", file);
      process.exit(2);
    }

    const meta = await sharp(file).metadata();
    console.log("Output dimensions:", meta.width, meta.height);

    if (!meta.width || !meta.height) {
      console.error("Test failed: unable to read output dimensions");
      process.exit(4);
    }

    // Assert within the given bounds
    if (meta.width > 200 || meta.height > 100) {
      console.error("Test failed: output exceeds max dimensions", meta.width, meta.height);
      process.exit(5);
    }

    if (meta.width < 50 || meta.height < 50) {
      console.error("Test failed: output below min dimensions", meta.width, meta.height);
      process.exit(6);
    }

    console.log("Test passed: file exists and dimensions within expected range ->", file);
    process.exit(0);
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(3);
  }
}

run();
