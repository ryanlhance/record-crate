// Backfill previews for records that the first pass missed — either because
// iTunes throttled the request (false "no match") or because the naive
// `artist title` search returned the WRONG album (a tribute / same-named single).
//
// Unlike fetch-previews.mjs, this does an ARTIST-AWARE match: it pulls several
// candidates and picks the one whose artist + title actually agree with the
// record, then requires the album to have real preview clips. It FORCE-rewrites
// the worksheet entry for each target (overwriting a bad cached match).
//
//   node scripts/backfill-previews.mjs
// Then curate the new "chosen" picks and run apply-previews.mjs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Records to (re)fetch with strict matching. `va: true` relaxes the artist
// check for Various-Artists compilations (match on title instead).
const TARGETS = [
  { id: "pink-floyd-dark-side-of-the-moon" },
  { id: "anderson-paak-venice" },
  { id: "leon-bridges-leon" },
  { id: "klique-try-it-out" },
  { id: "santana-zebop" },
  { id: "tom-misch-geography" },
  { id: "tomita-snowflakes-are-dancing" },
  { id: "thee-sacred-souls-got-a-story-to-tell" },
  { id: "sylvester-too-hot-to-sleep" },
  { id: "vampire-weekend-vampire-weekend" },
  { id: "childish-gambino-awaken-my-love" },
  { id: "idris-muhammad-make-it-count" },
  { id: "billy-cobham-alivemutherforya" },
  { id: "various-artists-saturday-night-fever", va: true },
];

async function getJSON(url, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) {
        await sleep(4000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.results == null) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      return data;
    } catch {
      await sleep(2500 * (attempt + 1));
    }
  }
  return null;
}

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Token-overlap ratio of `a` covered by `b`. */
function overlap(a, b) {
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (!A.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / A.size;
}

async function albumTracks(collectionId) {
  const data = await getJSON(
    `https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=US`
  );
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
  const sheet = fs.existsSync(SHEET)
    ? JSON.parse(fs.readFileSync(SHEET, "utf8"))
    : {};
  const byId = Object.fromEntries(records.map((r) => [r.id, r]));

  for (const target of TARGETS) {
    const rec = byId[target.id];
    if (!rec) {
      console.log(`? ${target.id}: not a record`);
      continue;
    }

    const term = encodeURIComponent(`${rec.artist} ${rec.title}`);
    const data = await getJSON(
      `https://itunes.apple.com/search?term=${term}&entity=album&limit=6&country=US`
    );
    const results = (data?.results ?? []).filter((r) => r.collectionId);

    // Score candidates; require decent title agreement and (unless VA) artist agreement.
    const scored = results
      .map((r) => {
        const aScore = target.va ? 1 : overlap(rec.artist, r.artistName);
        const tScore = overlap(rec.title, r.collectionName);
        return { r, score: tScore * 2 + aScore, aScore, tScore };
      })
      .filter((c) => c.tScore >= 0.5 && (target.va || c.aScore >= 0.5))
      .sort((a, b) => b.score - a.score);

    let picked = null;
    for (const cand of scored.slice(0, 2)) {
      await sleep(3500);
      const tracks = await albumTracks(cand.r.collectionId);
      if (tracks.some((t) => t.preview)) {
        picked = { album: cand.r, tracks };
        break;
      }
    }

    if (!picked) {
      console.log(
        `✗ ${rec.artist} — ${rec.title}  (no confident match w/ previews` +
          `${results.length ? "" : "; search empty/throttled"})`
      );
      await sleep(1500);
      continue;
    }

    const auto = picked.tracks.find((t) => t.preview);
    sheet[rec.id] = {
      artist: rec.artist,
      title: rec.title,
      match: `${picked.album.collectionName} — ${picked.album.artistName}`,
      chosen: auto.id,
      chosenName: auto.name,
      tracks: picked.tracks,
    };
    fs.writeFileSync(SHEET, JSON.stringify(sheet, null, 2) + "\n");
    console.log(
      `✓ ${rec.artist} — ${rec.title}  →  ${picked.album.collectionName}  ▶ ${auto.name}`
    );
    await sleep(5000);
  }

  console.log(`\nBackfill done. Review new picks in ${SHEET}, then curate + apply.`);
}

main();
