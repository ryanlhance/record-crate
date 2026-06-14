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

async function lookupItunes(artist, title, retries = 4) {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1&country=US`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      // iTunes throttles bursts with 403/429 — back off and retry.
      if (res.status === 403 || res.status === 429) {
        await sleep(2500 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      // An empty body can also mean a transient throttle; retry a couple times.
      if (!data.results) {
        await sleep(2000 * (attempt + 1));
        continue;
      }
      return data.results[0] ?? null;
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
}

// Fallback art source: Deezer's public API (no key). Often has albums that
// aren't on the US iTunes catalog. Returns a ~1000px cover URL or null.
async function lookupDeezerCover(artist, title, retries = 3) {
  const q = encodeURIComponent(`${artist} ${title}`);
  const url = `https://api.deezer.com/search/album?q=${q}&limit=1`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      const data = await res.json();
      const hit = data?.data?.[0];
      return hit?.cover_xl || hit?.cover_big || null;
    } catch {
      await sleep(1500 * (attempt + 1));
    }
  }
  return null;
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
  const usedIds = new Set();

  for (const row of rows) {
    const artist = row.artist || "";
    const title = row.title || "";
    if (!artist || !title) continue;

    // Unique id even when the same album appears in two collections.
    let id = slugify(`${artist}-${title}`);
    const base = id;
    let n = 2;
    while (usedIds.has(id)) id = `${base}-${n++}`;
    usedIds.add(id);

    const dest = path.join(COVERS_DIR, `${id}.jpg`);
    const genres = splitMulti(row.genre);
    let year = row.year ? Number(row.year) : null;
    let cover = PLACEHOLDER;
    let status = "·"; // · = reused existing cover, ✓ = fetched, ✗ = miss

    if (fs.existsSync(dest)) {
      // Already have this cover from a previous run — skip the API call.
      cover = `/covers/${id}.jpg`;
    } else {
      const hit = await lookupItunes(artist, title);
      if (hit?.artworkUrl100) {
        const hiRes = hit.artworkUrl100.replace("100x100bb", "1000x1000bb");
        const ok = await downloadCover(hiRes, dest);
        cover = ok ? `/covers/${id}.jpg` : PLACEHOLDER;
      }
      if (genres.length === 0 && hit?.primaryGenreName) {
        genres.push(hit.primaryGenreName);
      }
      if (!year && hit?.releaseDate) {
        const parsed = Number(hit.releaseDate.slice(0, 4));
        year = Number.isFinite(parsed) ? parsed : null;
      }

      // iTunes missed — try Deezer before giving up.
      if (cover === PLACEHOLDER) {
        const deezerUrl = await lookupDeezerCover(artist, title);
        if (deezerUrl && (await downloadCover(deezerUrl, dest))) {
          cover = `/covers/${id}.jpg`;
          status = "✓ (deezer)";
        }
      }

      if (status === "·") status = cover === PLACEHOLDER ? "✗" : "✓";
      await sleep(1200); // stay under the rate limits
    }

    if (cover === PLACEHOLDER) misses.push(`${artist} — ${title}`);

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

    console.log(`${status} ${artist} — ${title}`);
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
