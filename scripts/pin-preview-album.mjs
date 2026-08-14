// Pin a record to a specific album by id, for the cases no matcher can reach —
// e.g. Kitaro's "Tunhuang", which Apple files under its kanji title 敦煌, or
// 33Hz's "Whatever Happened to the Party?", which streams under the band's
// self-titled name. No amount of title similarity connects those.
//
// Fetches that album's tracks and writes the worksheet entry, same shape as the
// automated passes, so curate + apply work unchanged.
//
//   node scripts/pin-preview-album.mjs <recordId> <itunesCollectionId>
//   node scripts/pin-preview-album.mjs <recordId> dz:<deezerAlbumId>

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");

const [recordId, collectionId] = process.argv.slice(2);
if (!recordId || !collectionId) {
  console.error("usage: node scripts/pin-preview-album.mjs <recordId> <collectionId>");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url, retries = 6) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) {
        await sleep(4000 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) {
        await sleep(3000 * (i + 1));
        continue;
      }
      return JSON.parse(text);
    } catch {
      await sleep(2500 * (i + 1));
    }
  }
  return null;
}

const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
const rec = records.find((r) => r.id === recordId);
if (!rec) {
  console.error(`no record with id ${recordId}`);
  process.exit(1);
}

const isDeezer = collectionId.startsWith("dz:");
let album, tracks;

if (isDeezer) {
  const d = await getJSON(`https://api.deezer.com/album/${collectionId.slice(3)}`);
  if (!d || d.error) {
    console.error(`no Deezer album ${collectionId}`);
    process.exit(1);
  }
  album = { collectionName: d.title, artistName: d.artist?.name };
  tracks = (d.tracks?.data ?? []).map((t, i) => ({
    id: `dz:${t.id}`,
    name: t.title,
    n: t.track_position ?? i + 1,
    preview: t.preview || null,
  }));
} else {
  const data = await getJSON(
    `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=US`
  );
  album = (data?.results ?? []).find((r) => r.wrapperType === "collection");
  tracks = (data?.results ?? [])
    .filter((r) => r.wrapperType === "track" && r.kind === "song")
    .map((t) => ({
      id: t.trackId,
      name: t.trackName,
      n: t.trackNumber ?? null,
      preview: t.previewUrl ?? null,
    }));
}

if (!tracks.some((t) => t.preview)) {
  console.error(`album ${collectionId} has no playable previews`);
  process.exit(1);
}

const sheet = JSON.parse(fs.readFileSync(SHEET, "utf8"));
const auto = tracks.find((t) => t.preview);
sheet[recordId] = {
  artist: rec.artist,
  title: rec.title,
  ...(isDeezer ? { source: "deezer" } : {}),
  match:
    `${album?.collectionName ?? collectionId} — ${album?.artistName ?? "?"}` +
    (isDeezer ? " (Deezer)" : ""),
  chosen: auto.id,
  chosenName: auto.name,
  tracks,
};
fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");

console.log(
  `✓ ${rec.artist} — ${rec.title}\n     → ${album?.collectionName} — ${album?.artistName}` +
    `  (${tracks.filter((t) => t.preview).length}/${tracks.length} playable)`
);
tracks.forEach((t) =>
  console.log(`     ${t.preview ? "▶" : "·"} ${t.id}  ${t.n ?? "?"}. ${t.name}`)
);
