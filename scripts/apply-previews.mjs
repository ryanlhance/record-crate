// Apply the curated preview picks (scripts/previews.json) onto the live data
// (src/data/records.json). Additive: only touches each record's `preview` field,
// leaving collection/edition/cover/genres untouched.
//
// For every record whose worksheet entry has a `chosen` track id, writes:
//   "preview": { "trackId": <id>, "track": "<name>", "url": "<apple 30s clip>" }
// Records with chosen === null get no `preview` (the play button won't show).
//
//   node scripts/apply-previews.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");

const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const sheet = JSON.parse(fs.readFileSync(SHEET, "utf8"));

let applied = 0;
let cleared = 0;
const missingUrl = [];
const expiring = [];

// The data is baked into a static export, so a clip URL has to still work
// weeks from now. Apple's preview assets are stable; Deezer's are signed with
// an `exp=` that dies in minutes. Refuse to bake anything time-limited.
const isExpiring = (url) => /[?&](hdnea|exp)=|expires=/i.test(url);

for (const r of records) {
  const entry = sheet[r.id];
  const chosen =
    entry && entry.chosen != null
      ? entry.tracks.find((t) => t.id === entry.chosen)
      : null;

  if (chosen?.preview && isExpiring(chosen.preview)) {
    expiring.push(`${r.artist} — ${r.title} (${entry.match ?? "?"})`);
    delete r.preview;
    continue;
  }

  if (chosen && chosen.preview) {
    r.preview = { trackId: chosen.id, track: chosen.name, url: chosen.preview };
    applied++;
  } else {
    if (r.preview) cleared++;
    delete r.preview;
    if (entry && entry.chosen != null && !chosen?.preview) {
      missingUrl.push(`${r.artist} — ${r.title} (chosen id has no preview url)`);
    }
  }
}

fs.writeFileSync(RECORDS, JSON.stringify(records, null, 2) + "\n");
console.log(`Applied ${applied} previews. Cleared ${cleared}.`);
if (missingUrl.length) {
  console.log(`\nCheck these — chosen track has no preview url:`);
  missingUrl.forEach((m) => console.log("  - " + m));
}
if (expiring.length) {
  console.log(
    `\nSKIPPED — clip URL expires, can't be baked into a static build:`
  );
  expiring.forEach((m) => console.log("  - " + m));
  console.log(`  Find the record on Apple instead and use pin-preview-album.mjs.`);
}
