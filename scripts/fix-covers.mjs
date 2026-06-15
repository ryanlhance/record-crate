// Re-fetch specific album covers that came back wrong, WITH verification that the
// matched release actually corresponds to the album (artist + title), trying
// iTunes -> Deezer -> MusicBrainz/Cover Art Archive. Updates both the cover file
// and the `cover` field in src/data/records.json. Misses become the placeholder.
//
// Run with:  node scripts/fix-covers.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const COVERS_DIR = path.join(root, "public", "covers");
const UA = "record-crate-cover-fixer/1.0 ( ryanlhance@gmail.com )";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ids to refetch, with explicit artist/title/year for matching.
const TARGETS = [
  { id: "childish-gambino-awaken-my-love", artist: "Childish Gambino", title: "Awaken, My Love!" },
  { id: "anderson-paak-tiny-desk-concert", artist: "Anderson .Paak", title: "Tiny Desk Concert" },
  { id: "anderson-paak-venice", artist: "Anderson .Paak", title: "Venice" },
  { id: "engelbert-humperdinck-after-the-lovin", artist: "Engelbert Humperdinck", title: "After the Lovin'" },
  { id: "klique-try-it-out", artist: "Klique", title: "Try It Out" },
  { id: "leon-bridges-leon", artist: "Leon Bridges", title: "Leon" },
  { id: "pink-floyd-dark-side-of-the-moon", artist: "Pink Floyd", title: "The Dark Side of the Moon" },
  { id: "tomita-snowflakes-are-dancing", artist: "Tomita", title: "Snowflakes Are Dancing" },
  { id: "vampire-weekend-vampire-weekend", artist: "Vampire Weekend", title: "Vampire Weekend" },
  { id: "various-artists-more-than-muzak", artist: "Various Artists", title: "More Than Muzak", forcePlaceholder: true },
  { id: "various-artists-the-world-of-private-music-vol-ii", artist: "Various Artists", title: "The World of Private Music, Vol. II" },
];

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

// Reject re-records / singles / live / tribute versions unless the wanted title
// itself contains those words.
function badRelease(candTitle, wantTitle) {
  const bad = /\b(re-?record|single|live|karaoke|tribute|instrumental|remix|greatest hits|best of)\b/i;
  return bad.test(candTitle) && !bad.test(wantTitle);
}

function titleMatch(candTitle, wantTitle) {
  if (badRelease(candTitle, wantTitle)) return false;
  const ct = norm(candTitle);
  const wt = norm(wantTitle);
  if (!ct || !wt) return false;
  if (ct.includes(wt) || wt.includes(ct)) return true;
  const wtWords = wt.split(" ").filter((w) => w.length > 2);
  const hits = wtWords.filter((w) => ct.includes(w)).length;
  return wtWords.length > 0 && hits / wtWords.length >= 0.7;
}

function artistMatch(candArtist, wantArtist) {
  const ca = norm(candArtist);
  const wa = norm(wantArtist);
  if (wa === "various artists") return true; // comps: rely on title
  return wa.split(" ").some((w) => w.length >= 4 && ca.includes(w));
}

async function getJSON(url) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function download(url, dest) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) return false; // guard against empty/placeholder
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function tryItunes(t) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    `${t.artist} ${t.title}`
  )}&entity=album&limit=10&country=US`;
  const data = await getJSON(url);
  for (const r of data?.results ?? []) {
    if (titleMatch(r.collectionName, t.title) && artistMatch(r.artistName, t.artist)) {
      return { src: "itunes", url: r.artworkUrl100.replace("100x100bb", "1000x1000bb"), label: `${r.artistName} — ${r.collectionName}` };
    }
  }
  return null;
}

async function tryDeezer(t) {
  const url = `https://api.deezer.com/search/album?q=${encodeURIComponent(
    `${t.artist} ${t.title}`
  )}&limit=10`;
  const data = await getJSON(url);
  for (const a of data?.data ?? []) {
    if (titleMatch(a.title, t.title) && artistMatch(a.artist?.name, t.artist)) {
      return { src: "deezer", url: a.cover_xl || a.cover_big, label: `${a.artist?.name} — ${a.title}` };
    }
  }
  return null;
}

async function tryCAA(t) {
  const q = encodeURIComponent(`artist:"${t.artist}" AND releasegroup:"${t.title}"`);
  const data = await getJSON(
    `https://musicbrainz.org/ws/2/release-group?query=${q}&fmt=json&limit=5`
  );
  await sleep(1100);
  for (const rg of data?.["release-groups"] ?? []) {
    const credit = rg["artist-credit"]?.[0]?.name;
    if (titleMatch(rg.title, t.title) && artistMatch(credit, t.artist)) {
      return {
        src: "coverartarchive",
        url: `https://coverartarchive.org/release-group/${rg.id}/front-500`,
        label: `${credit} — ${rg.title}`,
      };
    }
  }
  return null;
}

async function main() {
  const albums = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
  const byId = Object.fromEntries(albums.map((a) => [a.id, a]));

  for (const t of TARGETS) {
    const dest = path.join(COVERS_DIR, `${t.id}.jpg`);
    const rec = byId[t.id];
    if (t.forcePlaceholder) {
      if (rec) rec.cover = "/placeholder.svg";
      if (fs.existsSync(dest)) fs.rmSync(dest);
      console.log(`▢ ${t.title}  (forced placeholder — ambiguous title)`);
      continue;
    }
    let found = null;
    for (const fn of [tryItunes, tryDeezer, tryCAA]) {
      found = await fn(t);
      await sleep(2500); // spacing to avoid iTunes/Deezer throttling
      if (found && (await download(found.url, dest))) break;
      found = null;
    }
    if (found) {
      if (rec) rec.cover = `/covers/${t.id}.jpg`;
      console.log(`✓ ${t.title}  ←  ${found.src}: ${found.label}`);
    } else {
      if (rec) rec.cover = "/placeholder.svg";
      if (fs.existsSync(dest)) fs.rmSync(dest);
      console.log(`✗ ${t.title}  (no verified match — set to placeholder)`);
    }
  }

  fs.writeFileSync(RECORDS, JSON.stringify(albums, null, 2) + "\n");
  console.log("\nUpdated src/data/records.json");
}

main();
