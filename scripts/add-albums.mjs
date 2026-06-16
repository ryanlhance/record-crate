// One-off: append Ryan's new albums to records.json, fetching cover art + year
// from iTunes (Deezer fallback), mirroring build-data.mjs. Existing records are
// left untouched. Also appends rows to records.csv.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const JSON_PATH = path.join(root, "src", "data", "records.json");
const CSV_PATH = path.join(__dirname, "records.csv");
const COVERS_DIR = path.join(root, "public", "covers");
const PLACEHOLDER = "/placeholder.svg";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// New albums. `q` is the cover/metadata search term; year/edition optional.
const NEW = [
  { id: "asap-rocky-dont-be-dumb", artist: "A$AP Rocky", title: "Don't Be Dumb", genres: ["R&B", "Experimental"], q: "A$AP Rocky Don't Be Dumb", edition: "BILT Member Exclusive Vinyl" },
  { id: "kitaro-tunhuang", artist: "Kitaro", title: "Tunhuang", genres: ["Experimental", "Jazz"], q: "Kitaro Tunhuang" },
  { id: "engelbert-humperdinck-wonderland-by-night", artist: "Engelbert Humperdinck", title: "Wonderland by Night", genres: ["Lounge"], q: "Engelbert Humperdinck Wonderland by Night" },
  { id: "deodato-love-island", artist: "Deodato", title: "Love Island", genres: ["Rock"], q: "Deodato Love Island" },
  { id: "deodato-very-together", artist: "Deodato", title: "Very Together", genres: ["Rock"], q: "Deodato Very Together" },
  { id: "dave-valentin-mind-time", artist: "Dave Valentin", title: "Mind Time", genres: ["Jazz"], q: "Dave Valentin Mind Time" },
  { id: "richard-clayderman-ensuenos", artist: "Richard Clayderman", title: "Ensueños", genres: ["Lounge"], q: "Richard Clayderman Ensueños" },
  { id: "bluewerks-vol-1-up-down-left-right", artist: "Bluewerks", title: "Bluewerks Vol. 1: Up Down Left Right", genres: ["Lounge"], q: "Bluewerks Up Down Left Right" },
  { id: "billy-cobham-alivemutherforya", artist: "Billy Cobham, Steve Khan, Alphonso Johnson, Tom Scott", title: "Alivemutherforya", genres: ["Jazz"], q: "Billy Cobham Alivemutherforya", year: 1978 },
  { id: "andre-3000-new-blue-sun", artist: "Andre 3000", title: "New Blue Sun", genres: ["Experimental", "Jazz"], q: "Andre 3000 New Blue Sun", edition: "180G Limited Edition" },
];

async function lookupItunes(term, retries = 4) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=1&country=US`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) { await sleep(2500 * (i + 1)); continue; }
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.results) { await sleep(2000 * (i + 1)); continue; }
      return data.results[0] ?? null;
    } catch { await sleep(1500 * (i + 1)); }
  }
  return null;
}

async function lookupDeezer(term, retries = 3) {
  const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(term)}&limit=1`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) { await sleep(1500 * (i + 1)); continue; }
      const data = await res.json();
      const hit = data?.data?.[0];
      return hit ? { cover: hit.cover_xl || hit.cover_big || null } : null;
    } catch { await sleep(1500 * (i + 1)); }
  }
  return null;
}

async function download(url, dest) {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch { return false; }
}

const albums = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
const have = new Set(albums.map((a) => a.id));
const misses = [];

for (const n of NEW) {
  if (have.has(n.id)) { console.log("skip (exists):", n.id); continue; }
  const dest = path.join(COVERS_DIR, `${n.id}.jpg`);
  let cover = PLACEHOLDER;
  let year = n.year ?? null;

  const it = await lookupItunes(n.q);
  if (it) {
    if (!year && it.releaseDate) year = Number(it.releaseDate.slice(0, 4)) || null;
    const art = it.artworkUrl100?.replace("100x100bb", "1000x1000bb");
    if (art && (await download(art, dest))) cover = `/covers/${n.id}.jpg`;
  }
  if (cover === PLACEHOLDER) {
    const dz = await lookupDeezer(n.q);
    if (dz?.cover && (await download(dz.cover, dest))) cover = `/covers/${n.id}.jpg`;
  }
  if (cover === PLACEHOLDER) misses.push(`${n.artist} — ${n.title}`);

  const rec = { id: n.id, artist: n.artist, title: n.title, collection: "main", genres: n.genres, vibes: [], year, cover };
  if (n.edition) rec.edition = n.edition;
  albums.push(rec);
  console.log(`${cover === PLACEHOLDER ? "NO COVER" : "ok"}  ${n.id}  (year ${year ?? "?"})`);
  await sleep(400);
}

fs.writeFileSync(JSON_PATH, JSON.stringify(albums, null, 2) + "\n");

// Append CSV rows.
const esc = (v) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csvRows = NEW.filter((n) => !have.has(n.id)).map((n) =>
  [esc(n.artist), esc(n.title), "Main", esc(n.genres.join(";")), esc(albums.find((a) => a.id === n.id)?.year ?? "")].join(",")
);
fs.appendFileSync(CSV_PATH, csvRows.join("\n") + "\n");

console.log(`\nTotal albums now: ${albums.length}`);
if (misses.length) console.log("MISSING COVERS (need manual art):\n - " + misses.join("\n - "));
