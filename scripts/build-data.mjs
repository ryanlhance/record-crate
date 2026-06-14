// Build the app's record data from scripts/records.csv.
//
// What it does:
//   1. Reads scripts/records.csv (the export from your Notion collection).
//   2. For each record, looks it up on Apple's free iTunes Search API to get
//      cover art (and to backfill genre/year when your CSV leaves them blank).
//   3. Downloads each cover into public/covers/<id>.jpg.
//   4. Writes the final data to src/data/records.json (what the app reads).
//
// Run it with:   npm run build:data
// No API key or account needed. Re-run any time you update the CSV.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const CSV_PATH = path.join(__dirname, "records.csv");
const COVERS_DIR = path.join(root, "public", "covers");
const OUT_PATH = path.join(root, "src", "data", "records.json");
const PLACEHOLDER = "/placeholder.svg";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Minimal CSV parser that handles quoted fields containing commas/newlines. */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? "").trim()));
    return obj;
  });
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitMulti(value) {
  return value
    ? value
        .split(/[;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

function normalizeCollection(value) {
  const t = (value || "").toLowerCase();
  if (t.startsWith("special")) return "special";
  if (t.startsWith("comp")) return "compilation";
  return "main";
}

async function lookupItunes(artist, title) {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

async function downloadCover(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`Missing ${CSV_PATH}. Export your records there first.`);
    process.exit(1);
  }
  fs.mkdirSync(COVERS_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });

  const rows = parseCSV(fs.readFileSync(CSV_PATH, "utf8"));
  console.log(`Found ${rows.length} records in CSV.\n`);

  const albums = [];
  const misses = [];

  for (const row of rows) {
    const artist = row.artist || "";
    const title = row.title || "";
    if (!artist || !title) continue;

    const id = slugify(`${artist}-${title}`);
    const hit = await lookupItunes(artist, title);

    let cover = PLACEHOLDER;
    if (hit?.artworkUrl100) {
      const hiRes = hit.artworkUrl100.replace("100x100bb", "1000x1000bb");
      const dest = path.join(COVERS_DIR, `${id}.jpg`);
      const ok = await downloadCover(hiRes, dest);
      cover = ok ? `/covers/${id}.jpg` : PLACEHOLDER;
    }
    if (cover === PLACEHOLDER) misses.push(`${artist} — ${title}`);

    const genres = splitMulti(row.genre);
    if (genres.length === 0 && hit?.primaryGenreName) {
      genres.push(hit.primaryGenreName);
    }

    let year = row.year ? Number(row.year) : null;
    if (!year && hit?.releaseDate) {
      const parsed = Number(hit.releaseDate.slice(0, 4));
      year = Number.isFinite(parsed) ? parsed : null;
    }

    albums.push({
      id,
      artist,
      title,
      collection: normalizeCollection(row.collection),
      genres,
      vibes: splitMulti(row.vibe),
      year,
      cover,
    });

    console.log(`${cover === PLACEHOLDER ? "✗" : "✓"} ${artist} — ${title}`);
    await sleep(300); // be polite to the iTunes API
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(albums, null, 2) + "\n");
  console.log(`\nWrote ${albums.length} records to ${OUT_PATH}.`);

  if (misses.length) {
    console.log(
      `\n${misses.length} record(s) had no cover from iTunes — drop a square ` +
        `image into public/covers/<id>.jpg manually:\n  - ${misses.join(
          "\n  - "
        )}`
    );
  }
}

main();
