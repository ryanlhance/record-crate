// Diagnostic: dump what iTunes actually returns for a record, so a stubborn
// no-match can be judged by eye instead of by score. Read-only.
//
//   node scripts/probe-previews.mjs <recordId> [extra search term...]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const records = JSON.parse(
  fs.readFileSync(path.join(root, "src", "data", "records.json"), "utf8")
);

const [id, ...extra] = process.argv.slice(2);
const rec = records.find((r) => r.id === id);
if (!rec) {
  console.error(`no record with id ${id}`);
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

const terms = [`${rec.artist} ${rec.title}`, rec.title, rec.artist, ...extra];

console.log(`${rec.artist} — ${rec.title}  (${rec.year})\n`);

for (const term of terms) {
  const q = new URLSearchParams({
    term,
    entity: "album",
    limit: "15",
    country: "US",
  });
  const data = await getJSON(`https://itunes.apple.com/search?${q}`);
  const results = data?.results ?? [];
  console.log(`— "${term}" → ${results.length} results`);
  for (const r of results.slice(0, 12)) {
    console.log(
      `    ${r.collectionId}  ${r.artistName}  ::  ${r.collectionName}` +
        `  [${(r.releaseDate || "").slice(0, 4)}]`
    );
  }
  console.log();
  await sleep(1500);
}
