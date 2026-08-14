// Deezer fallback for records Apple doesn't carry — KEPT FOR SEARCHING ONLY.
//
// ⚠️  DO NOT BAKE DEEZER URLS INTO records.json. Deezer's clip URLs are signed
// and short-lived: every one carries `hdnea=exp=<unix ts>` and dies about ten
// minutes after it is issued. Apple's preview URLs are stable assets, which is
// the only reason the baked-static approach works at all. A Deezer link that
// plays on your machine at build time is already dead by the time anyone loads
// the site — worse than no play button, because it looks broken rather than
// absent.
//
// So this script REFUSES to write to the worksheet. It reports what Deezer has
// that Apple doesn't, and that's it — use it to discover an album, then find
// the same record on Apple and pin it with pin-preview-album.mjs. (That's how
// 33Hz got sorted: Deezer revealed the LP is filed under the band's self-titled
// name, and Apple turned out to have it under that name too.)
//
// If a record is genuinely Deezer-only and you want it playable, the clip has
// to be downloaded and self-hosted — a deliberate call, not something to
// automate here.
//
//   node scripts/deezer-previews.mjs
//   node scripts/deezer-previews.mjs --only <recordId>

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

// Alternate artist/title spellings to try on Deezer.
const HINTS = {
  "tomita-snowflakes-are-dancing": {
    artists: ["Tomita", "Isao Tomita"],
    titles: ["Snowflakes Are Dancing"],
  },
  "klique-try-it-out": { artists: ["Klique"], titles: ["Try It Out"] },
  "dave-valentin-mind-time": { artists: ["Dave Valentin"], titles: ["Mind Time"] },
  "idris-muhammad-make-it-count": {
    artists: ["Idris Muhammad"],
    titles: ["Make It Count"],
  },
  "richard-clayderman-ensuenos": {
    artists: ["Richard Clayderman"],
    titles: ["Ensueños", "Ensuenos"],
  },
  "jean-luc-ponty-live-at-montreux-72": {
    artists: ["Jean-Luc Ponty"],
    titles: ["Live at Montreux", "Montreux '72"],
  },
  "33hz-whatever-happened-to-the-party": {
    artists: ["33Hz"],
    titles: ["Whatever Happened to the Party?", "Whatever Happened to the Party"],
  },
  "anderson-paak-tiny-desk-concert": {
    artists: ["Anderson .Paak"],
    titles: ["Tiny Desk Concert", "NPR Music Tiny Desk Concert"],
  },
  "various-artists-the-world-of-private-music-vol-ii": {
    artists: ["Private Music"],
    titles: ["The World of Private Music"],
  },
};

async function getJSON(url, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await sleep(4000 * (i + 1));
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      // Deezer signals quota with an `error` envelope and HTTP 200.
      if (data?.error) {
        await sleep(4000 * (i + 1));
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

async function searchAlbums(artist, title) {
  const q = `artist:"${artist}" album:"${title}"`;
  const data = await getJSON(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(q)}&limit=25`
  );
  const strict = data?.data ?? [];
  if (strict.length) return strict;
  // Fall back to a loose query — Deezer's field syntax misses some old titles.
  const loose = await getJSON(
    `https://api.deezer.com/search/album?q=${encodeURIComponent(`${artist} ${title}`)}&limit=25`
  );
  return loose?.data ?? [];
}

async function albumTracks(albumId) {
  const data = await getJSON(`https://api.deezer.com/album/${albumId}`);
  const tracks = data?.tracks?.data ?? [];
  return tracks.map((t, i) => ({
    id: `dz:${t.id}`,
    name: t.title,
    n: t.track_position ?? i + 1,
    preview: t.preview || null,
  }));
}

async function main() {
  const records = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
  const sheet = fs.existsSync(SHEET) ? JSON.parse(fs.readFileSync(SHEET, "utf8")) : {};

  const targets = records.filter(
    (r) => !r.preview && !sheet[r.id]?.chosen && (!ONLY || r.id === ONLY)
  );
  console.log(`Trying Deezer for ${targets.length} records Apple didn't have.\n`);

  const found = [];
  const missed = [];

  for (const rec of targets) {
    const hint = HINTS[rec.id] ?? {};
    const artists = hint.artists ?? [rec.artist];
    const titles = hint.titles ?? [rec.title];

    const pool = new Map();
    for (const a of artists) {
      for (const t of titles) {
        for (const al of await searchAlbums(a, t)) pool.set(al.id, al);
        await sleep(700);
      }
    }

    const scored = [...pool.values()]
      .map((al) => {
        const aScore = overlap(rec.artist, al.artist?.name ?? "");
        const t = overlap(titles[0], al.title);
        const rev = overlap(al.title, titles[0]);
        return { al, aScore, score: t + rev + aScore, t, rev };
      })
      .filter((c) => c.t >= 0.75 && c.rev >= 0.5)
      .sort((a, b) => b.score - a.score);

    let picked = null;
    for (const cand of scored.slice(0, 3)) {
      await sleep(700);
      const tracks = await albumTracks(cand.al.id);
      if (tracks.some((t) => t.preview)) {
        picked = { album: cand.al, tracks };
        break;
      }
    }

    if (!picked) {
      const near = [...pool.values()]
        .map((al) => ({ al, s: overlap(titles[0], al.title) }))
        .sort((x, y) => y.s - x.s)[0];
      missed.push(rec);
      console.log(
        `✗ ${rec.artist} — ${rec.title}   (${pool.size} Deezer candidates` +
          (near && near.s > 0
            ? `, closest "${near.al.title}" — ${near.al.artist?.name}`
            : "") +
          `)`
      );
      continue;
    }

    // Report only — see the header. Nothing is written to the worksheet.
    found.push(rec.id);
    console.log(
      `● ${rec.artist} — ${rec.title}\n     Deezer has: ${picked.album.title} — ${picked.album.artist?.name}` +
        `  (${picked.tracks.filter((t) => t.preview).length}/${picked.tracks.length} playable)` +
        `\n     → look for this album on Apple, then: node scripts/pin-preview-album.mjs ${rec.id} <collectionId>`
    );
    await sleep(1000);
  }

  console.log(
    `\nFound ${found.length}/${targets.length} on Deezer (nothing written — Deezer URLs expire).`
  );
  if (missed.length) {
    console.log(`\nNot on Deezer either:`);
    missed.forEach((r) => console.log(`  - ${r.artist} — ${r.title}`));
  }
}

main();
