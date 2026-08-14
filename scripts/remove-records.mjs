// Pull records off the shelf: drop them from records.json, from the preview
// worksheet, and delete their cover art.
//
// Records are removed by id and the ids are checked first — an id that doesn't
// match anything aborts the whole run rather than silently removing 17 of 18,
// which is the failure mode that actually bites when a name is guessed wrong.
//
// Curated preview picks in curate-previews*.mjs are NOT edited here; those are
// hand-maintained lists. The script reports which keys are now dead so they can
// be pruned by hand.
//
//   node scripts/remove-records.mjs --dry-run
//   node scripts/remove-records.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");
const COVERS = path.join(root, "public", "covers");

const DRY = process.argv.includes("--dry-run");

// Ryan's 2026-08-14 cull.
const REMOVE = [
  "spyro-gyra-freetime",
  "spyro-gyra-morning-dance",
  "richard-clayderman-ensuenos",
  "earl-klugh-heartstrings",
  "david-sanborn-taking-off",
  "david-sanborn-voyeur",
  "chaka-khan-rufus-street-player",
  "bluewerks-vol-1-up-down-left-right",
  "billy-cobham-alivemutherforya",
  "33hz-whatever-happened-to-the-party",
  "santana-zebop",
  "santana-shango",
  "phoenix-bankrupt",
  "little-river-band-time-exposure",
  "california-honeydrops-a-river-s-invitation",
  "various-artists-the-world-of-private-music-vol-ii",
  "tomita-snowflakes-are-dancing",
  "dave-valentin-mind-time",
];

const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const byId = new Map(records.map((r) => [r.id, r]));

const unknown = REMOVE.filter((id) => !byId.has(id));
if (unknown.length) {
  console.error(`Aborting — these ids aren't in records.json:`);
  unknown.forEach((id) => console.error(`  - ${id}`));
  process.exit(1);
}

const removing = new Set(REMOVE);
const kept = records.filter((r) => !removing.has(r.id));

console.log(`Removing ${REMOVE.length} records (${records.length} → ${kept.length}):`);
for (const id of REMOVE) {
  const r = byId.get(id);
  console.log(`  - ${r.artist} — ${r.title}  [${r.collection}]`);
}

// Genres/collections that would be left with nothing behind them.
const count = (list, key) => {
  const out = {};
  for (const r of list) for (const v of key(r)) out[v] = (out[v] || 0) + 1;
  return out;
};
const gBefore = count(records, (r) => r.genres ?? []);
const gAfter = count(kept, (r) => r.genres ?? []);
const emptied = Object.keys(gBefore).filter((g) => !gAfter[g]);
const cAfter = count(kept, (r) => [r.collection]);

console.log(`\nCollections after: ${JSON.stringify(cAfter)}`);
console.log(`Genres after: ${JSON.stringify(gAfter)}`);
if (emptied.length) console.log(`⚠ genres left empty: ${emptied.join(", ")}`);

// Covers to delete.
const covers = REMOVE.map((id) => path.join(COVERS, `${id}.jpg`)).filter((p) =>
  fs.existsSync(p)
);
console.log(`\nCover files to delete: ${covers.length}/${REMOVE.length}`);

// Worksheet entries + now-dead curated picks.
const sheet = fs.existsSync(SHEET) ? JSON.parse(fs.readFileSync(SHEET, "utf8")) : {};
const sheetHits = REMOVE.filter((id) => sheet[id]);
console.log(`Preview worksheet entries to drop: ${sheetHits.length}`);

const curateFiles = ["curate-previews.mjs", "curate-previews-2.mjs"];
const deadPicks = [];
for (const f of curateFiles) {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, "utf8");
  for (const id of REMOVE) if (src.includes(`"${id}"`)) deadPicks.push(`${f}: ${id}`);
}

if (DRY) {
  console.log(`\n(dry run — nothing written)`);
} else {
  fs.writeFileSync(RECORDS, JSON.stringify(kept, null, 2) + "\n");
  for (const id of sheetHits) delete sheet[id];
  fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");
  covers.forEach((p) => fs.unlinkSync(p));
  console.log(`\nWrote records.json (${kept.length}), pruned worksheet, deleted covers.`);
}

if (deadPicks.length) {
  console.log(`\nDead curated picks — prune these by hand:`);
  deadPicks.forEach((d) => console.log(`  - ${d}`));
}
