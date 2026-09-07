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
// and the covers; an iPad can show both, so the crate lives in a rail and the
// shelf behind it narrows in place.
//
// What a tablet does NOT change:
//   · How a set wants to be looked at. Cover-flow = savor one, grid = scan many
//     is a rule about the size of the SET, so the main pane runs the same
//     `shelfView` the phone routes run.
//   · The pecking order of the navigation. On the phone home screen the primary
//     controls are the painted sign and the cardboard dividers — pictures, no
//     labels, no headings — and the three collections sit underneath as a quiet
//     text footer beneath a hairline. The rail keeps exactly that order and
//     exactly that weight. No section headings, no "everything" row: the sign
//     IS the way back to everything, as it is on the phone.

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
  // `savor` marks the sets the phone always gives the hinge to regardless of
  // size: the curated collections, and the handful you get from narrowing to
  // one artist or one year.
  let savor = false;

  switch (filter.kind) {
    case "collection":
      albums = getByCollection(filter.value);
      savor = filter.value !== "main";
      break;
    case "genre":
      albums = getByGenre(filter.value);
      break;
    case "artist":
      albums = getByArtistSlug(slugifyArtist(filter.value));
      savor = true;
      break;
    case "year":
      albums = getByYear(filter.value);
      savor = true;
      break;
    default:
      albums = getAllAlbums();
  }

  const flow = shelfView(albums, { savor }) === "flow";

  // Artist and year aren't in the rail — you reach them from a facet inside the
  // detail sheet, same as on the phone — so nothing on screen would otherwise
  // say what you narrowed to or how to get out. That chip is the only text the
  // shelf adds, and only when it's the difference between navigable and stuck.
  const stranded =
    filter.kind === "artist" || filter.kind === "year"
      ? String(filter.value)
      : null;

  const narrowShelf = (facet: Facet) => {
    if (facet.kind === "genre") setFilter({ kind: "genre", value: facet.value });
    else if (facet.kind === "artist")
      setFilter({ kind: "artist", value: facet.value });
    else setFilter({ kind: "year", value: facet.value });
  };

  return (
    <TabletShelfContext.Provider value={narrowShelf}>
      <div className="flex min-h-full flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
        {/* ── The crate ─────────────────────────────────────────────────────
            A fixed rail in landscape; a strip above the shelf in portrait.
            Sign, then dividers, then the collections footer — the phone home
            screen's order and weight, turned on its side. */}
        <aside className="shrink-0 border-b border-white/10 lg:h-screen lg:w-[17rem] lg:overflow-y-auto lg:border-b-0 lg:border-r xl:w-[19rem]">
          <div className="px-5 pb-5 pt-5 lg:px-6">
            {/* The painted sign — primary, and the way back to everything, the
                same job it does on the phone home screen. Full width. */}
            <button
              type="button"
              onClick={() => setFilter({ kind: "all" })}
              aria-label="Ryan's Collection — show the whole shelf"
              className="block w-full overflow-hidden rounded-2xl transition active:scale-[0.98]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetPath("/ui/hero.png")}
                alt=""
                className="aspect-[2/1] w-full select-none object-cover"
              />
            </button>

            {/* The bin dividers — the other primary control. No heading: they
                are pictures and they speak for themselves. */}
            <div className="mt-6">
              <GenreWall
                genres={genres}
                active={filter.kind === "genre" ? filter.value : null}
                onSelect={(g) => setFilter({ kind: "genre", value: g })}
                className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-1 lg:gap-2.5"
              />
            </div>

            {/* Collections — a quiet, stacked text footer under a hairline
                divider, exactly as on the phone. They don't compete with the
                sign and the divider artwork. */}
            <nav className="mt-8 border-t border-foreground/10 pt-4">
              <ul className="flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-6 lg:flex-col lg:gap-x-0">
                {COLLECTIONS.map((c) => {
                  const on =
                    filter.kind === "collection" && filter.value === c.type;
                  return (
                    <li key={c.type}>
                      <button
                        type="button"
                        onClick={() =>
                          setFilter({ kind: "collection", value: c.type })
                        }
                        aria-pressed={on}
                        className={`block py-2 text-sm transition active:text-foreground ${
                          on ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {COLLECTION_LABELS[c.type]}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/"
                className="mt-2 block py-2 text-sm text-muted transition active:text-foreground"
              >
                Phone version
              </Link>
            </nav>
          </div>
        </aside>

        {/* ── The shelf ─────────────────────────────────────────────────────
            No heading over the covers: on the phone the artwork carries the
            context, and here the rail already shows what's selected. */}
        <main className="flex min-w-0 flex-1 flex-col lg:h-screen lg:overflow-y-auto">
          {stranded && (
            <div className="flex items-center gap-2 px-6 pt-5 lg:px-8">
              <button
                type="button"
                onClick={() => setFilter({ kind: "all" })}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-muted transition active:scale-95"
              >
                <Close className="h-3 w-3" />
                {stranded}
              </button>
            </div>
          )}

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
