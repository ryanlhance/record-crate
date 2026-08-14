// Curation pass for the records backfilled in the second round — same idea as
// curate-previews.mjs: replace the auto-pick (always just the first playable
// track) with the cut that actually sells the record in 30 seconds.
//
// Re-runnable; only touches the keys listed here.
//
//   node scripts/curate-previews-2.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHEET = path.join(__dirname, "previews.json");

// recordId -> chosen track id (the signature "taste test" track), or null to
// suppress the preview (no honest match exists — better silent than wrong).
const PICKS = {
  "anderson-paak-venice": 1887659417, // Milk N' Honey
  "childish-gambino-awaken-my-love": 1771719595, // Redbone
  "leon-bridges-leon": 1760811410, // Peaceful Place
  "pink-floyd-dark-side-of-the-moon": 1065973708, // Money
  "sylvester-too-hot-to-sleep": 1444035719, // Give It Up (Don't Make Me Wait)
  "thee-sacred-souls-got-a-story-to-tell": 1749131364, // Lucid Girl (lead single — auto-pick was already right)
  "tom-misch-geography": 1327772855, // It Runs Through Me (feat. De La Soul)
  "vampire-weekend-vampire-weekend": 270425147, // Oxford Comma (A-Punk isn't on the store's tracklist)
  "various-artists-saturday-night-fever": 1445668462, // Stayin' Alive
  "various-artists-more-than-muzak": 1251032665, // Satin Doll
  "asap-rocky-dont-be-dumb": 1862935174, // DON'T BE DUMB / TRIP BABY (title track)
  "kitaro-tunhuang": 1132450951, // Fuujin (opener of 敦煌)

  // — no honest match on Apple OR Deezer: leave these silent —
  "jean-luc-ponty-live-at-montreux-72": null, // only the 1994 Montreux album exists; this is the '72 date
};

const sheet = JSON.parse(fs.readFileSync(SHEET, "utf8"));
let changed = 0;
const warn = [];

for (const [id, trackId] of Object.entries(PICKS)) {
  const e = sheet[id];
  if (!e) {
    warn.push(`${id}: not in worksheet`);
    continue;
  }
  if (trackId === null) {
    e.chosen = null;
    e.chosenName = null;
    changed++;
    continue;
  }
  const t = e.tracks.find((x) => x.id === trackId);
  if (!t) {
    warn.push(`${id}: track ${trackId} not found`);
    continue;
  }
  if (!t.preview) {
    warn.push(`${id}: track ${trackId} (${t.name}) has no preview url`);
    continue;
  }
  e.chosen = t.id;
  e.chosenName = t.name;
  changed++;
}

fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");
console.log(`Curated ${changed} picks.`);
if (warn.length) {
  console.log("Warnings:");
  warn.forEach((w) => console.log("  - " + w));
}
