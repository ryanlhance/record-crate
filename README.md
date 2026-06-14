# The Crate — a visual record collection

A phone-friendly web app for flipping through Ryan's record collection like a real
crate: album covers fanned out on a hinge that you swipe left/right. Friends open it,
browse **by collection** (Main · Special Editions · Compilations) or **by genre/vibe**,
and everything is sorted **by artist first name**. Tap the centered cover for details.

## Stack
- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Swiper** for the coverflow (fanned-hinge) interaction
- **No database** — the collection is a static `src/data/records.json` baked into the
  build. (Decision: read-only for friends, ~70 records, so a static site is simplest
  and free to host.)
- **Vercel** for hosting (gives a public link you can text to friends).

## Run it locally
```bash
npm install
npm run dev        # open http://localhost:3000
```

## Updating the collection (the data pipeline)
The collection lives in Notion. To refresh the app's data:

1. **Export from Notion.** Ask Claude Cowork to export the database to a CSV with these
   exact columns: `artist, title, collection, genre, vibe, year`.
   - `collection` is one of: `Main`, `Special Edition`, `Compilation`.
   - `genre` and `vibe` may hold multiple values separated by semicolons
     (e.g. `Jazz; Soul`). `vibe` may be blank.
2. Save it as `scripts/records.csv` (replacing the sample).
3. **Fetch covers + build the data file:**
   ```bash
   npm run build:data
   ```
   This looks each record up on Apple's free iTunes Search API, downloads cover art into
   `public/covers/`, backfills `year`/`genre` where your CSV is blank, and writes
   `src/data/records.json`. It prints a ✓/✗ per record and lists any covers it couldn't
   find — for those, drop a square image into `public/covers/<id>.jpg` by hand (the id is
   shown in the log), or correct the title/artist in the CSV and re-run.
4. `npm run dev` to check, then commit and push (Vercel auto-deploys).

## Deploying (GitHub + Vercel)
- **GitHub** stores the code. **Vercel** connects to the GitHub repo and gives you a
  public URL (e.g. `record-crate.vercel.app`); every push to `main` auto-rebuilds the
  live site. One repo + one Vercel project = one shareable link. Both are free.

## Project structure
- `src/data/records.json` — the collection (generated; the app's source of truth).
- `src/lib/records.ts` — load + sort/filter/search helpers.
- `src/components/CoverFlow.tsx` — the swipeable fanned coverflow (client component).
- `src/components/AlbumDetail.tsx` — tap-to-expand detail overlay.
- `src/app/` — landing, `collection/[type]`, `browse` + `browse/[tag]`, `search`.
- `scripts/build-data.mjs` — the cover-fetch / data-build script.
