// Reset albums whose auto-fetched cover/year was wrong or missing, so they show
// the placeholder (and no bogus year) until real art is dropped in. Then
// regenerate records.csv from the final JSON.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const JSON_PATH = path.join(root, "src", "data", "records.json");
const CSV_PATH = path.join(__dirname, "records.csv");
const COVERS_DIR = path.join(root, "public", "covers");
const PLACEHOLDER = "/placeholder.svg";

// ids with no good cover from iTunes/Deezer (wrong match or not in catalog).
const NEED_ART = [
  "asap-rocky-dont-be-dumb",
  "engelbert-humperdinck-wonderland-by-night",
  "kitaro-tunhuang",
  "dave-valentin-mind-time",
  "richard-clayderman-ensuenos",
];

const albums = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const byId = new Map(albums.map((a) => [a.id, a]));

for (const id of NEED_ART) {
  const a = byId.get(id);
  if (!a) { console.error("missing id", id); continue; }
  // Remove any wrong cover that was downloaded.
  const f = path.join(COVERS_DIR, `${id}.jpg`);
  if (fs.existsSync(f)) fs.unlinkSync(f);
  a.cover = PLACEHOLDER;
  a.year = null;
}

fs.writeFileSync(JSON_PATH, JSON.stringify(albums, null, 2) + "\n");

// Regenerate the whole CSV from JSON (keeps it consistent; genres ';'-joined).
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const coll = (c) => (c === "main" ? "Main" : c === "special" ? "Special Editions" : "Compilations");
const rows = [["artist", "title", "collection", "genre", "year"].join(",")];
for (const a of albums) rows.push([esc(a.artist), esc(a.title), coll(a.collection), esc(a.genres.join(";")), esc(a.year ?? "")].join(","));
fs.writeFileSync(CSV_PATH, rows.join("\n") + "\n");

console.log(`Reset ${NEED_ART.length} albums to placeholder; CSV regenerated (${albums.length} rows).`);
