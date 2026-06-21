// Generate the favicon/app-icon set and the social (Open Graph) card from the
// hand-made source art.
//   node scripts/build-icons-og.mjs
import sharp from "sharp";

// Square app icon with the black corners already baked in (no alpha) — used
// as-is at every size, including the iOS apple-touch-icon.
const APP_ICON = "images from Ryan/icon-filled.png";
// The sign on an expanded black background — the social card art.
const SHARING = "images from Ryan/sharing.png";

// --- App icons ---
for (const size of [512, 192, 32]) {
  await sharp(APP_ICON).resize(size, size, { fit: "cover" }).png()
    .toFile(`public/icon-${size}.png`);
}
await sharp(APP_ICON).resize(180, 180, { fit: "cover" }).png()
  .toFile("public/apple-touch-icon.png");

// --- Social card: 1200x630 (the ideal large-card ratio). The source is already
// the sign on black, so letterbox onto black — seamless, nothing cropped. ---
await sharp(SHARING)
  .resize(1200, 630, { fit: "contain", background: "#000000" })
  .png()
  .toFile("public/og.png");

console.log("Wrote: public/icon-{512,192,32}.png, apple-touch-icon.png, og.png");
