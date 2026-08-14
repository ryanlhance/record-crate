// Third backfill pass — by ARTIST CATALOG instead of by text search.
//
// Why: iTunes' /search index is unreliable for older catalog. Searching
// "Pink Floyd Dark Side of the Moon" returns The Wall, Meddle and a reggae
// tribute, but not the record itself; "Vampire Weekend Vampire Weekend"
// returns every album EXCEPT the self-titled debut. No amount of scoring
// rescues an album that never appears in the results.
//
// The /lookup endpoint doesn't have that problem. Resolve the artist once
// (musicArtist search → artistId), then ask for that artist's whole album
// list (`lookup?id=<artistId>&entity=album&limit=200`) and title-match inside
// it. The debut that search hides is right there in the catalog listing.
//
// Only records still missing a `preview` are touched, a match must clear a
// title-similarity bar AND have playable clips, and the year is sanity-checked
// so a 1994 live album can't stand in for a '72 one.
//
//   node scripts/backfill-previews-3.mjs
//   node scripts/backfill-previews-3.mjs --only <recordId>
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

// The name to look the artist up under, when the shelf credit isn't what Apple
// files them as, plus the album title to match on if the sleeve differs.
const HINTS = {
  "childish-gambino-awaken-my-love": { title: "Awaken, My Love!" },
  "asap-rocky-dont-be-dumb": { artist: "A$AP Rocky" },
  "anderson-paak-venice": { artist: "Anderson .Paak" },
  "anderson-paak-tiny-desk-concert": { artist: "Anderson .Paak" },
  "jean-luc-ponty-live-at-montreux-72": { artist: "Jean-Luc Ponty" },
  "richard-clayderman-ensuenos": { artist: "Richard Clayderman" },
  "tomita-snowflakes-are-dancing": { artist: "Isao Tomita" },
  "idris-muhammad-make-it-count": { artist: "Idris Muhammad" },
  "dave-valentin-mind-time": { artist: "Dave Valentin" },
  "kitaro-tunhuang": { artist: "Kitaro", title: "Tunhuang" },
  "klique-try-it-out": { artist: "Klique" },
  "33hz-whatever-happened-to-the-party": { artist: "33Hz" },
  "various-artists-the-world-of-private-music-vol-ii": {
    artist: "Private Music",
    title: "The World of Private Music",
  },
};

let throttled = 0;

async function getJSON(url, retries = 6) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 403 || res.status === 429) {
        throttled++;
        await sleep(4000 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const text = await res.text();
      if (!text.trim()) {
        throttled++;
        await sleep(3000 * (i + 1));
        continue;
      }
      const data = JSON.parse(text);
      if (!data || data.results == null) {
        throttled++;
        await sleep(3000 * (i + 1));
        continue;
      }
      return data;
    } catch {
      await sleep(2500 * (i + 1));
    }
  }
  return null;
}

const STOP = new Set(["the", "a", "an", "and", "of", "&"]);

const norm = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !STOP.has(t));

function overlap(a, b) {
  const A = new Set(norm(a));
  const B = new Set(norm(b));
  if (!A.size) return 0;
  let hit = 0;
  for (const t of A) if (B.has(t)) hit++;
  return hit / A.size;
}

/** Strip the reissue noise Apple appends, so titles compare like for like. */
const bare = (s) =>
  (s || "")
    .replace(
      /\s*[\(\[](deluxe|expanded|remaster(ed)?|.*remaster.*|bonus track.*|anniversary.*|\d{4}\s*mix|mono|stereo)[^\)\]]*[\)\]]/gi,
      ""
    )
    .trim();

/** Years mentioned inside a title ("Live at Montreux '72" -> 1972). */
function titleYears(s) {
  const out = [];
  for (const m of (s || "").matchAll(/(?:^|\D)(19|20)(\d{2})(?!\d)/g))
    out.push(Number(m[1] + m[2]));
  for (const m of (s || "").matchAll(/'(\d{2})(?!\d)/g)) {
    const n = Number(m[1]);
    out.push(n > 30 ? 1900 + n : 2000 + n);
  }
  return out;
}

async function artistId(name) {
  const q = new URLSearchParams({
    term: name,
    entity: "musicArtist",
    limit: "10",
    country: "US",
  });
  const data = await getJSON(`https://itunes.apple.com/search?${q}`);
  const hits = (data?.results ?? []).filter((r) => r.artistId);
  if (!hits.length) return null;
  const scored = hits
    .map((r) => ({ r, s: overlap(name, r.artistName) + overlap(r.artistName, name) }))
    .sort((a, b) => b.s - a.s);
  return scored[0].s >= 1 ? scored[0].r : null;
}

async function artistAlbums(id) {
  const data = await getJSON(
    `https://itunes.apple.com/lookup?id=${id}&entity=album&limit=200&country=US`
  );
  return (data?.results ?? []).filter(
    (r) => r.wrapperType === "collection" && r.collectionId
  );
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

  // Records with no preview AND nothing usable in the worksheet yet — don't
  // re-fetch (or clobber) entries an earlier pass already matched.
  const targets = records.filter(
    (r) => !r.preview && !sheet[r.id]?.chosen && (!ONLY || r.id === ONLY)
  );
  console.log(`Catalog-matching ${targets.length} records.\n`);

  const found = [];
  const missed = [];

  for (const rec of targets) {
    const hint = HINTS[rec.id] ?? {};
    const lookupName = hint.artist ?? rec.artist;
    const wantTitle = hint.title ?? rec.title;

    const artist = await artistId(lookupName);
    await sleep(1200);
    if (!artist) {
      missed.push({ rec, why: `no artist "${lookupName}" in the catalog` });
      console.log(`✗ ${rec.artist} — ${rec.title}   (artist not found)`);
      continue;
    }

    const albums = await artistAlbums(artist.artistId);
    await sleep(1200);

    const wantYears = titleYears(wantTitle);
    const scored = albums
      .map((a) => {
        const name = bare(a.collectionName);
        const t = overlap(wantTitle, name);
        const rev = overlap(name, wantTitle);
        const relYear = Number((a.releaseDate || "").slice(0, 4)) || null;
        const albYears = titleYears(a.collectionName);
        // A live album naming a different year than the record is a different record.
        const yearClash =
          wantYears.length && albYears.length && !albYears.some((y) => wantYears.includes(y));
        return { a, t, rev, relYear, yearClash, score: t + rev };
      })
      .filter((c) => c.t >= 0.75 && c.rev >= 0.5 && !c.yearClash)
      .sort((a, b) => b.score - a.score);

    let picked = null;
    for (const cand of scored.slice(0, 3)) {
      await sleep(2200);
      const tracks = await albumTracks(cand.a.collectionId);
      if (tracks.some((t) => t.preview)) {
        picked = { album: cand.a, tracks };
        break;
      }
    }

    if (!picked) {
      const near = albums
        .map((a) => ({ a, s: overlap(wantTitle, bare(a.collectionName)) }))
        .sort((x, y) => y.s - x.s)[0];
      missed.push({
        rec,
        why:
          `${albums.length} albums under ${artist.artistName}, none matched` +
          (near && near.s > 0 ? `; closest "${near.a.collectionName}"` : ""),
      });
      console.log(
        `✗ ${rec.artist} — ${rec.title}   (${albums.length} albums for ${artist.artistName}` +
          (near && near.s > 0 ? `, closest "${near.a.collectionName}"` : "") +
          `)`
      );
      await sleep(1200);
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
    await sleep(2500);
  }

  console.log(
    `\nMatched ${found.length}/${targets.length}.` +
      (throttled ? `  (${throttled} throttled requests)` : "")
  );
  if (missed.length) {
    console.log(`\nStill unmatched:`);
    missed.forEach((m) => console.log(`  - ${m.rec.artist} — ${m.rec.title}\n      ${m.why}`));
  }
}

main();
