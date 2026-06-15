// Gather candidate Reddit comments for each album from the public Reddit archive
// (pullpush.io — the Pushshift successor, no auth). This only collects RAW
// candidates into scripts/reddit-candidates.json; a human/LLM then curates the
// best 3-5 per album into src/data/reddit.json. Comments are frozen at scrape
// time — nothing here runs in the live site.
//
// Run with:  node scripts/fetch-reddit.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const RECORDS = path.join(root, "src", "data", "records.json");
const OUT = path.join(__dirname, "reddit-candidates.json");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Subreddits where album talk tends to be substantive (used to boost ranking).
const MUSIC_SUBS = new Set(
  [
    "Music", "LetsTalkMusic", "vinyl", "indieheads", "hiphopheads", "popheads",
    "jazz", "funk", "soul", "Disco", "rnb", "progrockmusic", "prog",
    "ProgMetal", "classicrock", "70smusic", "80smusic", "Soulies",
    "vinyljerk", "albumaday", "ifyoulikeblank", "fantanoforever", "RandB",
    "country", "outlaws", "TrueMusic", "listentothis", "albums",
  ].map((s) => s.toLowerCase())
);

async function pullpush(params) {
  const url =
    "https://api.pullpush.io/reddit/search/comment/?" +
    new URLSearchParams(params).toString();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "record-crate-quote-collector/1.0" },
      });
      if (res.status === 429 || res.status >= 500) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return [];
      const data = await res.json();
      return data?.data ?? [];
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return [];
}

function clean(body) {
  return body
    .replace(/\s+/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // markdown links -> text
    .trim();
}

async function gatherForAlbum(artist, title) {
  // Two passes: artist+title (precise), and title within r/vinyl (vinyl flavor).
  const a = await pullpush({
    q: `${artist} ${title}`,
    size: "40",
    sort_type: "score",
    sort: "desc",
  });
  await sleep(1100);
  const b = await pullpush({
    q: title,
    subreddit: "vinyl",
    size: "15",
    sort_type: "score",
    sort: "desc",
  });
  await sleep(1100);

  const seen = new Set();
  const out = [];
  for (const c of [...a, ...b]) {
    const body = clean(c.body || "");
    const key = body.slice(0, 80).toLowerCase();
    if (!body || seen.has(key)) continue;
    if (body.length < 15 || body.length > 400) continue; // readable + self-contained
    seen.add(key);
    out.push({
      body,
      subreddit: c.subreddit,
      score: c.score ?? 0,
      music: MUSIC_SUBS.has(String(c.subreddit).toLowerCase()),
    });
  }
  // Music subs first, then by score.
  out.sort((x, y) => (y.music - x.music) || (y.score - x.score));
  return out.slice(0, 15);
}

async function main() {
  const albums = JSON.parse(fs.readFileSync(RECORDS, "utf8"));
  const result = {};
  let withHits = 0;

  for (const album of albums) {
    const candidates = await gatherForAlbum(album.artist, album.title);
    result[album.id] = candidates;
    if (candidates.length) withHits++;
    console.log(
      `${candidates.length ? "•" : "·"} ${album.artist} — ${album.title}  (${candidates.length} candidates)`
    );
  }

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2) + "\n");
  console.log(
    `\nWrote candidates for ${albums.length} albums (${withHits} had hits) to ${OUT}`
  );
}

main();
