// Fetch 30-second Apple preview clips for the library — the "taste test" audio.
//
// What it does:
//   1. Reads src/data/records.json (the live data — we layer on top, never rebuild).
//   2. For each record, finds its album on Apple's free iTunes API, then looks up
//      that album's track list (each track carries a `previewUrl` — a 30s m4a clip
//      streamed from Apple's CDN; no key, no account).
//   3. Writes a CURATION WORKSHEET to scripts/previews.json: every track per album
//      plus a `chosen` track id (auto-seeded to the first track that has a preview).
//      Hand-edit `chosen` to pick the signature track, then run apply-previews.mjs.
//
// It is resumable: records already filled in previews.json are skipped, and the
// worksheet is saved after every record, so an interrupted run loses nothing.
//
//   node scripts/fetch-previews.mjs            # fill in anything not yet fetched
//   node scripts/fetch-previews.mjs --refresh  # re-fetch everything from scratch

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");

const REFRESH = process.argv.includes("--refresh");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET JSON with iTunes-aware backoff (403/429/empty body = throttle). */
async function getJSON(url, retries = 5) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.results == null) {
        await sleep(2500 * (attempt + 1));
        continue;
      }
      return data;
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

async function findAlbum(artist, title) {
  const term = encodeURIComponent(`${artist} ${title}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=album&limit=1&country=US`;
  const data = await getJSON(url);
  return data?.results?.[0] ?? null;
}

async function albumTracks(collectionId) {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=US`;
  const data = await getJSON(url);
  return (data?.results ?? [])
    .filter((r) => r.wrapperType === "track" && r.kind === "song")
    .map((t) => ({
      id: t.trackId,
      name: t.trackName,
      n: t.trackNumber ?? null,
      preview: t.previewUrl ?? null,
    }));
}

async function main() {
  const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
  const sheet =
    !REFRESH && fs.existsSync(SHEET)
      ? JSON.parse(fs.readFileSync(SHEET, "utf8"))
      : {};

  const save = () =>
    fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");

  let done = 0;
  for (const r of records) {
    const existing = sheet[r.id];
    if (existing && Array.isArray(existing.tracks) && existing.tracks.length) {
      done++;
      continue; // already fetched
    }

    const album = await findAlbum(r.artist, r.title);
    if (!album?.collectionId) {
      sheet[r.id] = {
        artist: r.artist,
        title: r.title,
        match: null,
        chosen: null,
        chosenName: null,
        tracks: [],
      };
      console.log(`✗ ${r.artist} — ${r.title}  (no album match)`);
      save();
      await sleep(1500);
      continue;
    }

    await sleep(900);
    const tracks = await albumTracks(album.collectionId);
    const withPreview = tracks.filter((t) => t.preview);
    const auto = withPreview[0] ?? null;

    sheet[r.id] = {
      artist: r.artist,
      title: r.title,
      match: `${album.collectionName} — ${album.artistName}`,
      chosen: auto?.id ?? null,
      chosenName: auto?.name ?? null,
      tracks,
    };

    console.log(
      `${withPreview.length ? "✓" : "·"} ${r.artist} — ${r.title}  ` +
        `(${withPreview.length}/${tracks.length} playable)` +
        (auto ? `  ▶ ${auto.name}` : "")
    );
    save();
    done++;
    await sleep(1500); // stay well under the rate limit
  }

  const playable = Object.values(sheet).filter((e) => e.chosen).length;
  console.log(
    `\nFetched ${done}/${records.length}. ${playable} have a preview clip.\n` +
      `Worksheet: ${SHEET}\nEdit each "chosen" to the signature track id, then ` +
      `run: node scripts/apply-previews.mjs`
  );
}

main();
