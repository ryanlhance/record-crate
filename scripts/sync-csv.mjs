// Bring scripts/records.csv back in line with src/data/records.json.
//
// records.json is the source of truth — it's hand-maintained, and its ids and
// titles carry fixes the CSV never had (Ponty's "Inner City" mislabel, the
// Barbarella credit). The CSV is the Notion bootstrap that build-data.mjs
// reads. When records come off the shelf, the CSV keeps its rows, and a later
// `npm run build:data` would quietly resurrect every one of them.
//
// This prunes CSV rows that no longer exist in records.json, matching on
// artist + title (NOT on a slugified id — several ids were shortened by hand,
// e.g. billy-cobham-alivemutherforya for a four-name credit, so slugs don't
// round-trip). Surviving rows are copied through byte-for-byte, so quoting and
// column order are untouched.
//
// It only ever REMOVES. Records added to records.json since the last export
// are reported, not invented — those come from Notion.
//
//   node scripts/sync-csv.mjs --dry-run
//   node scripts/sync-csv.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const CSV = path.join(__dirname, "records.csv");

const DRY = process.argv.includes("--dry-run");

/** Parse one CSV line into fields, honouring quoted fields and "" escapes. */
function parseLine(line) {
  const out = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      out.push(field);
      field = "";
    } else field += c;
  }
  out.push(field);
  return out;
}

const key = (artist, title) =>
  `${artist}|${title}`.toLowerCase().normalize("NFKD").replace(/\s+/g, " ").trim();

const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const raw = fs.readFileSync(CSV, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";
const lines = raw.split(/\r?\n/);

// Keep the header; a trailing blank line is dropped and re-added on write.
const header = lines[0];
const body = lines.slice(1).filter((l) => l.trim() !== "");

const inJson = new Set(records.map((r) => key(r.artist, r.title)));
const inCsv = new Set();

const keep = [];
const dropped = [];
for (const line of body) {
  const [artist = "", title = ""] = parseLine(line).map((f) => f.trim());
  inCsv.add(key(artist, title));
  if (inJson.has(key(artist, title))) keep.push(line);
  else dropped.push(`${artist} — ${title}`);
}

const missing = records
  .filter((r) => !inCsv.has(key(r.artist, r.title)))
  .map((r) => `${r.artist} — ${r.title}`);

console.log(`CSV ${body.length} rows → ${keep.length}   (records.json: ${records.length})`);

if (dropped.length) {
  console.log(`\nPruning ${dropped.length} rows no longer on the shelf:`);
  dropped.forEach((d) => console.log(`  - ${d}`));
}

if (missing.length) {
  console.log(
    `\n⚠ ${missing.length} records are in records.json but NOT in the CSV.` +
      ` Re-export from Notion to pick these up — this script won't invent rows:`
  );
  missing.forEach((m) => console.log(`  + ${m}`));
}

if (keep.length !== records.length) {
  console.log(
    `\nNote: CSV (${keep.length}) and records.json (${records.length}) still differ.`
  );
}

if (!dropped.length) {
  console.log(`\nNothing to prune — CSV already matches.`);
} else if (DRY) {
  console.log(`\n(dry run — nothing written)`);
} else {
  fs.writeFileSync(CSV, [header, ...keep].join(eol) + eol);
  console.log(`\nWrote ${CSV}`);
}
