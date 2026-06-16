// One-off: apply Ryan's genre review to records.json (the runtime source of
// truth) and re-sync records.csv so the two don't drift. No network, no covers.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const JSON_PATH = path.join(root, "src", "data", "records.json");
const CSV_PATH = path.join(__dirname, "records.csv");

// Final genre arrays, keyed by album id. ("is" = set, "also" = add — already
// resolved here into the final intended value.)
const EDITS = {
  "childish-gambino-awaken-my-love": ["Funk", "Experimental"],
  "earth-wind-fire-electric-universe": ["Funk", "Disco"],
  "robert-palmer-sneaking-sally-through-the-alley": ["Rock"],
  "david-sanborn-taking-off": ["Lounge"],
  "david-sanborn-voyeur": ["Lounge", "Funk"],
  "house-of-waters-rising": ["Experimental"],
  "earl-klugh-heartstrings": ["Lounge"],
  "jean-luc-ponty-cosmic-messenger": ["Jazz", "Rock"],
  "jean-luc-ponty-mystical-adventures": ["Jazz", "Experimental"],
  "jeff-goldblum-still-bloomin": ["Jazz", "Lounge"],
  "beach-boys-with-the-royal-philharmonic-orchestra": ["Rock", "Soul"],
  "spyro-gyra-freetime": ["Jazz", "Lounge"],
  "spyro-gyra-morning-dance": ["Jazz", "Lounge"],
  "various-artists-more-than-muzak": ["Lounge", "Jazz"],
  "various-artists-the-world-of-private-music-vol-ii": ["Lounge", "Jazz"],
  "abram-shook-the-neon-machine": ["Funk", "Soul"],
  "alabama-shakes-sound-and-color": ["Soul"],
  "father-john-misty-fear-fun": ["Soul"],
  "pink-floyd-dark-side-of-the-moon": ["Rock", "Experimental"],
  "marty-robbins-gunfighter-ballads-and-trail-songs": ["Lounge"], // fold Country -> Lounge
  // R&B introduced here:
  "anderson-paak-malibu": ["Soul", "R&B"],
  "anderson-paak-malibu-2": ["Soul", "R&B"],
  "anderson-paak-tiny-desk-concert": ["Soul", "Funk"],
  "anderson-paak-venice": ["R&B"],
  "childish-gambino-kauai": ["R&B", "Soul"],
  "klique-try-it-out": ["Disco"],
  "deodato-knights-of-fantasy": ["Rock"],
  "silk-sonic-an-evening-with-silk-sonic": ["Soul", "R&B", "Disco"],
  "sylvester-too-hot-to-sleep": ["Soul", "Disco"],
  "tom-misch-geography": ["Soul", "Disco"],
};

const albums = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const byId = new Map(albums.map((a) => [a.id, a]));

const missing = Object.keys(EDITS).filter((id) => !byId.has(id));
if (missing.length) {
  console.error("ERROR — ids not found:", missing);
  process.exit(1);
}

for (const [id, genres] of Object.entries(EDITS)) {
  byId.get(id).genres = genres;
}

// Sanity: Country gone, R&B present, 8 distinct genres.
const all = [...new Set(albums.flatMap((a) => a.genres))].sort();
if (all.includes("Country")) {
  console.error("ERROR — Country still present");
  process.exit(1);
}
console.log("Genres now:", all.join(", "));

fs.writeFileSync(JSON_PATH, JSON.stringify(albums, null, 2) + "\n");

// Re-sync the CSV from the JSON so the documented pipeline input matches the
// curated data (genres are ';'-joined per the pipeline's splitMulti).
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const rows = [["artist", "title", "collection", "genre", "year"].join(",")];
for (const a of albums) {
  rows.push(
    [
      esc(a.artist),
      esc(a.title),
      esc(
        a.collection === "main"
          ? "Main"
          : a.collection === "special"
            ? "Special Editions"
            : "Compilations"
      ),
      esc(a.genres.join(";")),
      esc(a.year ?? ""),
    ].join(",")
  );
}
fs.writeFileSync(CSV_PATH, rows.join("\n") + "\n");

console.log(`Applied ${Object.keys(EDITS).length} edits to ${albums.length} albums; CSV re-synced.`);
