// Generate the favicon/app-icon set and the social (Open Graph) card.
//   node scripts/build-icons-og.mjs
import sharp from "sharp";

const APP_ICON = "images from Ryan/app-icon.png";
const HERO = "public/ui/hero.png"; // transparent sign
const ESPRESSO = "#15110c";        // page background

// --- App icons (PNG, preserve transparency for favicon/PWA) ---
for (const size of [512, 192, 32]) {
  await sharp(APP_ICON).resize(size, size, { fit: "cover" }).png()
    .toFile(`public/icon-${size}.png`);
}
// Apple touch icon: iOS composites transparency onto black & masks its own
// rounded corners, so flatten onto black for a clean full-bleed tile.
await sharp(APP_ICON)
  .resize(180, 180, { fit: "cover" })
  .flatten({ background: "#000000" })
  .png()
  .toFile("public/apple-touch-icon.png");

// --- Social card: 1200x630 espresso canvas, sign centered with padding ---
const W = 1200, H = 630;
const sign = await sharp(HERO).resize(900, 450, { fit: "inside" }).toBuffer();
const meta = await sharp(sign).metadata();
await sharp({ create: { width: W, height: H, channels: 4, background: ESPRESSO } })
  .composite([{ input: sign, left: Math.round((W - meta.width) / 2), top: Math.round((H - meta.height) / 2) }])
  .png()
  .toFile("public/og.png");

console.log("Wrote: public/icon-512.png, icon-192.png, icon-32.png, apple-touch-icon.png, og.png");
