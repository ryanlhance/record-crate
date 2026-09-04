"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type Album,
  type CollectionType,
  COLLECTIONS,
  COLLECTION_LABELS,
  getAllAlbums,
  getByArtistSlug,
  getByCollection,
  getByGenre,
  getByYear,
  shelfView,
  slugifyArtist,
} from "@/lib/records";
import { assetPath } from "@/lib/asset";
import GenreWall from "@/components/GenreWall";
import RecordGrid from "@/components/RecordGrid";
import CoverFlow from "@/components/CoverFlow";
import ShuffleControl from "@/components/ShuffleControl";
import { TabletShelfContext, type Facet } from "./TabletShelfContext";
import { Close } from "@/components/icons";

// The iPad shelf: the whole collection on ONE screen.
//
// What a tablet changes is NAVIGATION, not presentation. A phone can only hold
// one thing at a time, so the phone app spends routes moving between the crate
// and the covers; an iPad can show both, so the dividers live in a rail and the
// shelf behind them narrows in place.
//
// What a tablet does NOT change is how a set wants to be looked at. Cover-flow
// = savor one, grid = scan many is a rule about the size of the SET, and an
// iPad doesn't make any set bigger or smaller. So the main pane runs the same
// `shelfView` the phone routes run, and a small genre or a curated collection
// gets the hinge here exactly as it does there — just at twice the cover size,
// which is the actual point of a tablet build.
//
// Landscape (>=lg, any iPad on its side) puts the rail beside an independently
// scrolling shelf: landscape is short on height, so a top filter bar would cost
// a row of covers. Portrait drops to the stacked layout.

type Filter =
  | { kind: "all" }
  | { kind: "collection"; value: CollectionType }
  | { kind: "genre"; value: string }
  | { kind: "artist"; value: string }
  | { kind: "year"; value: number };

export default function IpadShelf({ genres }: { genres: string[] }) {
  const [filter, setFilter] = useState<Filter>({ kind: "all" });

  // Every set comes from lib/records' own getters — same ordering, same
  // same-record de-duping in a genre bin — so the tablet can't drift from the
  // phone the way a hand-rolled copy of that logic would.
  let albums: Album[];
  let title: string;
  // `savor` marks the sets the phone always gives the hinge to regardless of
  // size: the curated collections, and the handful you get from narrowing to
  // one artist or one year.
  let savor = false;

  switch (filter.kind) {
    case "collection":
      albums = getByCollection(filter.value);
      title = COLLECTION_LABELS[filter.value];
      savor = filter.value !== "main";
      break;
    case "genre":
      albums = getByGenre(filter.value);
      title = filter.value;
      break;
    case "artist":
      albums = getByArtistSlug(slugifyArtist(filter.value));
      title = filter.value;
      savor = true;
      break;
    case "year":
      albums = getByYear(filter.value);
      title = String(filter.value);
      savor = true;
      break;
    default:
      albums = getAllAlbums();
      title = "Ryan's Shelf";
  }

  const flow = shelfView(albums, { savor }) === "flow";

  // Artist and year aren't in the rail — you reach them from a facet inside the
  // detail sheet, same as on the phone — so they need their own way back.
  const strandable = filter.kind === "artist" || filter.kind === "year";

  const narrowShelf = (facet: Facet) => {
    if (facet.kind === "genre") setFilter({ kind: "genre", value: facet.value });
    else if (facet.kind === "artist")
      setFilter({ kind: "artist", value: facet.value });
    else setFilter({ kind: "year", value: facet.value });
  };

  // A rail row. No counts: the phone keeps the collections a quiet text footer
  // and only reveals a count once you've arrived somewhere.
  const railRow = (label: string, on: boolean, go: () => void) => (
    <button
      key={label}
      type="button"
      onClick={go}
      aria-pressed={on}
      className={`w-full rounded-lg px-3 py-2 text-left font-display text-[0.95rem] whitespace-nowrap transition ${
        on ? "text-accent" : "text-muted hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <TabletShelfContext.Provider value={narrowShelf}>
      <div className="flex min-h-full flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        {/* ── Dividers ──────────────────────────────────────────────────────
            A fixed rail in landscape; a strip above the shelf in portrait. */}
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
              {railRow("Ryan's Shelf", filter.kind === "all", () =>
                setFilter({ kind: "all" })
              )}
              {COLLECTIONS.map((c) =>
                railRow(
                  c.label,
                  filter.kind === "collection" && filter.value === c.type,
                  () => setFilter({ kind: "collection", value: c.type })
                )
              )}
            </nav>
          </div>

          {/* The bin dividers. Stacked in the landscape rail so the left edge
              reads like the front of a crate; a grid in portrait. */}
          <div className="px-5 pb-5 lg:px-6">
            <p className="eyebrow mx-auto mb-2 max-w-2xl px-3 lg:mx-0 lg:max-w-none">
              Genres
            </p>
            <GenreWall
              genres={genres}
              active={filter.kind === "genre" ? filter.value : null}
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

        {/* ── The shelf ─────────────────────────────────────────────────── */}
        <main className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
          <header className="sticky top-0 z-30 flex items-baseline justify-between gap-4 border-b border-white/10 bg-background/90 px-6 py-4 backdrop-blur lg:px-8">
            <div className="flex min-w-0 items-baseline gap-3">
              <h1 className="truncate font-display text-2xl leading-tight lg:text-3xl">
                {title}
              </h1>
              {strandable && (
                <button
                  type="button"
                  onClick={() => setFilter({ kind: "all" })}
                  className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-muted transition active:scale-95"
                >
                  <Close className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
            <p className="shrink-0 text-sm text-muted">
              {albums.length} {albums.length === 1 ? "record" : "records"}
            </p>
          </header>

          {/* Savor or scan — the phone's rule, at tablet size. */}
          {flow ? (
            <CoverFlow
              key={`${filter.kind}:${"value" in filter ? filter.value : ""}`}
              albums={albums}
              variant="tablet"
            />
          ) : (
            <RecordGrid albums={albums} variant="ipad" />
          )}
        </main>

        {/* Shuffle draws from whatever is on the shelf right now. */}
        <ShuffleControl albums={albums} wide />
      </div>
    </TabletShelfContext.Provider>
  );
}
