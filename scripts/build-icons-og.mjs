// Generate the favicon/app-icon set and the social (Open Graph) card from the
// hand-made source art.
//   node scripts/build-icons-og.mjs
import sharp from "sharp";
import { copyFileSync } from "node:fs";

// Square app icon with the black corners already baked in (no alpha) — used
// as-is at every size, including the iOS apple-touch-icon.
const APP_ICON = "images from Ryan/icon-filled.png";
// The social card, already authored at the exact 1200x630 large-card ratio —
// copied verbatim (no re-encode) to preserve quality.
const OG_SRC = "images from Ryan/corrected-og-1200x630.png";

// --- App icons ---
for (const size of [512, 192, 32]) {
  await sharp(APP_ICON).resize(size, size, { fit: "cover" }).png()
    .toFile(`public/icon-${size}.png`);
}
await sharp(APP_ICON).resize(180, 180, { fit: "cover" }).png()
  .toFile("public/apple-touch-icon.png");

// --- Social card ---
copyFileSync(OG_SRC, "public/og.png");

console.log("Wrote: public/icon-{512,192,32}.png, apple-touch-icon.png, og.png");
