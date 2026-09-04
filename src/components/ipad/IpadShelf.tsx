"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  type Album,
  type CollectionType,
  COLLECTIONS,
  COLLECTION_LABELS,
} from "@/lib/records";
import { assetPath } from "@/lib/asset";
import GenreWall from "@/components/GenreWall";
import RecordGrid from "@/components/RecordGrid";
import ShuffleControl from "@/components/ShuffleControl";

// The iPad shelf: the whole collection on ONE screen.
//
// The phone app spends routes on navigation — a home screen, then /all, then a
// genre page — because a phone can only hold one of those at a time. A tablet
// doesn't have that problem, so this trades the route tree for a crate you
// stand in front of: dividers down the left, covers filling the rest, and the
// list swapping in place. Nothing here is new content or new behaviour; it is
// the same data, the same cards, the same detail sheet, given the room.
//
// Landscape (>=lg, every iPad turned sideways) puts the dividers in a fixed
// rail beside an independently-scrolling shelf, because landscape is short on
// height and a top bar would eat a row of covers. Portrait — and any phone that
// wanders in — drops to the stacked layout: dividers ride along the top as a
// horizontal strip and the page scrolls as one.

type Filter =
  | { kind: "all" }
  | { kind: "collection"; value: CollectionType }
  | { kind: "genre"; value: string };

export default function IpadShelf({
  all,
  genres,
}: {
  all: Album[];
  genres: string[];
}) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });

  // Filtering happens here rather than through lib/records' getters so the
  // whole shelf is passed in once from the server component and never re-reads
  // the module. Same ordering (artist first name) — `all` arrives sorted.
  const albums = useMemo(() => {
    if (filter.kind === "collection") {
      return all.filter((a) => a.collection === filter.value);
    }
    if (filter.kind === "genre") {
      const lower = filter.value.toLowerCase();
      // One entry per record: a title Ryan owns twice (a standard and a special
      // pressing) shouldn't sit in a genre bin twice. Prefer the main copy.
      const order: Record<CollectionType, number> = {
        main: 0,
        special: 1,
        compilation: 2,
      };
      const best = new Map<string, Album>();
      for (const a of all) {
        if (!a.genres.some((g) => g.toLowerCase() === lower)) continue;
        const key = `${a.artist.toLowerCase()}|||${a.title.toLowerCase()}`;
        const cur = best.get(key);
        if (!cur || order[a.collection] < order[cur.collection]) best.set(key, a);
      }
      return [...best.values()];
    }
    return all;
  }, [all, filter]);

  const title =
    filter.kind === "all"
      ? "The Whole Shelf"
      : filter.kind === "collection"
        ? COLLECTION_LABELS[filter.value]
        : filter.value;

  const isAll = filter.kind === "all";
  const activeGenre = filter.kind === "genre" ? filter.value : null;

  // A rail row (All / the three collections). Text, not artwork — the cardboard
  // dividers below are the loud element and two loud things fight.
  const railRow = (label: string, count: number, on: boolean, go: () => void) => (
    <button
      key={label}
      type="button"
      onClick={go}
      aria-pressed={on}
      className={`flex w-full items-baseline justify-between gap-2 rounded-lg px-3 py-2 text-left transition ${
        on ? "bg-accent/15 text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      <span
        className={`whitespace-nowrap font-display text-[0.95rem] ${
          on ? "text-accent" : ""
        }`}
      >
        {label}
      </span>
      <span className="text-xs tabular-nums text-muted">{count}</span>
    </button>
  );

  return (
    <div className="flex min-h-full flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      {/* ── Dividers ────────────────────────────────────────────────────────
          A fixed rail in landscape; a horizontal strip above the shelf in
          portrait. Same controls either way. */}
      <aside className="shrink-0 border-b border-white/10 lg:h-screen lg:w-[17rem] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[19rem]">
        <div className="px-5 pb-4 pt-5 lg:px-6">
          {/* The shop sign doubles as "show me everything". */}
          <button
            type="button"
            onClick={() => setFilter({ kind: "all" })}
            aria-label="Ryan's Collection — show the whole shelf"
            className="mx-auto block w-full max-w-sm overflow-hidden rounded-xl transition active:scale-[0.98] lg:max-w-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath("/ui/hero.png")}
              alt=""
              className="aspect-[2/1] w-full select-none object-cover"
            />
          </button>

          <nav className="mx-auto mt-4 grid max-w-2xl grid-cols-2 gap-1 sm:grid-cols-4 lg:mx-0 lg:max-w-none lg:grid-cols-1 lg:gap-0.5">
            {railRow("The Whole Shelf", all.length, isAll, () =>
              setFilter({ kind: "all" })
            )}
            {COLLECTIONS.map((c) =>
              railRow(
                c.label,
                all.filter((a) => a.collection === c.type).length,
                filter.kind === "collection" && filter.value === c.type,
                () => setFilter({ kind: "collection", value: c.type })
              )
            )}
          </nav>
        </div>

        {/* The bin dividers. Stacked in the landscape rail so the left edge
            reads like the front of a crate; a scrolling row in portrait. */}
        <div className="px-5 pb-5 lg:px-6">
          <p className="eyebrow mx-auto mb-2 max-w-2xl px-3 lg:mx-0 lg:max-w-none">
            Genres
          </p>
          <GenreWall
            genres={genres}
            active={activeGenre}
            onSelect={(g) => setFilter({ kind: "genre", value: g })}
            className="mx-auto grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4 lg:mx-0 lg:max-w-none lg:grid-cols-1 lg:gap-2.5"
          />
        </div>

        <div className="hidden px-9 pb-6 lg:block">
          <Link
            href="/"
            className="text-xs text-muted underline decoration-muted/40 underline-offset-4 transition hover:text-foreground"
          >
            Phone version
          </Link>
        </div>
      </aside>

      {/* ── The shelf ───────────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-baseline justify-between gap-4 border-b border-white/10 bg-background/90 px-6 py-4 backdrop-blur lg:px-8">
          <h1 className="font-display text-2xl leading-tight lg:text-3xl">
            {title}
          </h1>
          <p className="shrink-0 text-sm text-muted">
            {albums.length} {albums.length === 1 ? "record" : "records"}
          </p>
        </header>

        <RecordGrid albums={albums} variant="ipad" />
      </main>

      {/* Shuffle draws from whatever is on the shelf right now. */}
      <ShuffleControl albums={albums} wide />
    </div>
  );
}
