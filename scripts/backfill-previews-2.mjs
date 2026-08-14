// Second backfill pass for the 24 records still without a preview clip.
//
// The first two passes failed for two reasons: the naive `artist title` search
// pulled only a handful of candidates (so a same-named single or a tribute album
// won), and a throttled request looked identical to a genuine "no such album".
// This pass fixes both:
//
//   1. MULTIPLE QUERIES per record — `artist title`, title-only, an
//      albumTerm-attribute search, and any hand-written alias — pooled together
//      and deduped by collectionId, so a bad phrasing can't sink a record.
//   2. WIDE candidate set (limit 25) scored on artist + title token overlap,
//      with soundtrack/compilation records matched on title alone.
//   3. Throttling is reported separately from "no match", so a miss is real.
//
// Only records with no `preview` in records.json are touched, and only a
// confident match that actually has playable clips is written. Everything else
// is left alone for a human to look at.
//
//   node scripts/backfill-previews-2.mjs
//   node scripts/backfill-previews-2.mjs --only <recordId>
// Then curate the picks and run apply-previews.mjs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const SHEET = path.join(__dirname, "previews.json");

const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Hand-written search hints for records whose shelf name differs from how Apple
// lists them (abbreviations, alternate titles, VA comps credited to a label).
const ALIASES = {
  "anderson-paak-tiny-desk-concert": ["Anderson .Paak Yes Lawd", "NxWorries"],
  "anderson-paak-venice": ["Anderson .Paak Venice album"],
  "asap-rocky-dont-be-dumb": ["A$AP Rocky Don't Be Dumb", "ASAP Rocky Testing"],
  "billy-cobham-alivemutherforya": ["Cobham Alivemutherforya", "Alive Mutherforya"],
  "bluewerks-vol-1-up-down-left-right": ["Bluewerks Up Down Left Right"],
  "childish-gambino-awaken-my-love": ["Childish Gambino Awaken My Love"],
  "jean-luc-ponty-live-at-montreux-72": [
    "Jean-Luc Ponty Open Strings",
    "Jean-Luc Ponty Aurora",
  ],
  "klique-try-it-out": ["Klique Stop Doggin Me Around", "Klique group"],
  "leon-bridges-leon": ["Leon Bridges Leon album", "Leon Bridges Peaceful Place"],
  "richard-clayderman-ensuenos": ["Richard Clayderman Ensuenos", "Clayderman Dreams"],
  "various-artists-more-than-muzak": ["More Than Music Muzak"],
  "various-artists-the-world-of-private-music-vol-ii": [
    "The World of Private Music",
    "Private Music sampler",
  ],
  "various-artists-saturday-night-fever": [
    "Saturday Night Fever soundtrack Bee Gees",
  ],
};

// Records where the artist credit won't line up with Apple's (soundtracks,
// label samplers, compilations) — match on title alone.
const TITLE_ONLY = new Set([
  "various-artists-saturday-night-fever",
  "various-artists-more-than-muzak",
  "various-artists-the-world-of-private-music-vol-ii",
  "bluewerks-vol-1-up-down-left-right",
]);

let throttled = 0;

/** GET JSON with iTunes-aware backoff. Returns null on give-up. */
async function getJSON(url, retries = 6) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) {
        throttled++;
        await sleep(4000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) {
        throttled++;
        await sleep(3000 * (attempt + 1));
        continue;
      }
      const data = JSON.parse(text);
      if (!data || data.results == null) {
        throttled++;
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

const STOP = new Set(["the", "a", "an", "and", "of", "&"]);

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents (Ensueños -> ensuenos)
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));

/** Token-overlap ratio of `a` covered by `b`. */
function overlap(a, b) {
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (!A.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / A.size;
}

/** Penalise the usual impostors: tribute/karaoke/covers and single-track releases. */
function isImpostor(album) {
  const name = (album.collectionName || "").toLowerCase();
  const artist = (album.artistName || "").toLowerCase();
  return (
    / - single$/.test(name) ||
    /karaoke|tribute|made popular by|in the style of|reggae version|dub side/.test(
      name + " " + artist
    )
  );
}

async function search(term, attribute) {
  const q = new URLSearchParams({
    term,
    entity: "album",
    limit: "25",
    country: "US",
  });
  if (attribute) q.set("attribute", attribute);
  const data = await getJSON(`https://itunes.apple.com/search?${q}`);
  return (data?.results ?? []).filter((r) => r.collectionId);
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

  const targets = records.filter(
    (r) => !r.preview && (!ONLY || r.id === ONLY)
  );
  console.log(`Backfilling ${targets.length} records without a preview.\n`);

  const found = [];
  const missed = [];

  for (const rec of targets) {
    const titleOnly = TITLE_ONLY.has(rec.id);
    const terms = [
      `${rec.artist} ${rec.title}`,
      rec.title,
      ...(ALIASES[rec.id] ?? []),
    ];

    // Pool candidates across every phrasing, deduped by album id.
    const pool = new Map();
    for (const term of terms) {
      for (const r of await search(term)) pool.set(r.collectionId, r);
      await sleep(1200);
    }
    for (const r of await search(rec.title, "albumTerm"))
      pool.set(r.collectionId, r);
    await sleep(1200);

    const scored = [...pool.values()]
      .map((r) => {
        const aScore = titleOnly ? 1 : overlap(rec.artist, r.artistName);
        const tScore = overlap(rec.title, r.collectionName);
        // Reward a tight title (album name isn't padded with extra words).
        const tRev = overlap(r.collectionName, rec.title);
        return {
          r,
          aScore,
          tScore,
          score: tScore * 2 + aScore + tRev * 0.5 - (isImpostor(r) ? 1.5 : 0),
        };
      })
      .filter((c) => c.tScore >= 0.6 && (titleOnly || c.aScore >= 0.5))
      .sort((a, b) => b.score - a.score);

    let picked = null;
    for (const cand of scored.slice(0, 3)) {
      await sleep(2500);
      const tracks = await albumTracks(cand.r.collectionId);
      if (tracks.some((t) => t.preview)) {
        picked = { album: cand.r, tracks };
        break;
      }
    }

    if (!picked) {
      const near = scored[0] ?? null;
      missed.push({
        rec,
        pool: pool.size,
        near: near ? `${near.r.collectionName} — ${near.r.artistName}` : null,
      });
      console.log(
        `✗ ${rec.artist} — ${rec.title}  (${pool.size} candidates, none confident` +
          (near ? `; closest: ${near.r.collectionName}` : "") +
          `)`
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
    found.push(rec.id);
    console.log(
      `✓ ${rec.artist} — ${rec.title}\n     → ${picked.album.collectionName} — ${picked.album.artistName}` +
        `  (${picked.tracks.filter((t) => t.preview).length}/${picked.tracks.length} playable)  ▶ ${auto.name}`
    );
    await sleep(3000);
  }

  console.log(
    `\nMatched ${found.length}/${targets.length}.` +
      (throttled ? `  (${throttled} throttled requests along the way)` : "")
  );
  if (missed.length) {
    console.log(`\nStill unmatched — verify by hand:`);
    missed.forEach((m) =>
      console.log(
        `  - ${m.rec.artist} — ${m.rec.title}` +
          (m.near ? `   closest: ${m.near}` : "   (nothing close)")
      )
    );
  }
  console.log(`\nNext: review picks in ${SHEET}, curate, then apply-previews.mjs`);
}

main();
