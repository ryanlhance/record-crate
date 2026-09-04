"use client";

import { createContext, useContext } from "react";

// The tablet shelf is a single screen, so a facet tapped inside the detail
// sheet — the artist, the year, a genre chip — has to narrow the shelf behind
// it rather than navigate to a phone-scale route and strand you there.
//
// AlbumDetail is shared with the phone app, which DOES want those facets to be
// links. So the handler arrives by context rather than by prop: inside the
// tablet shelf there's a provider and the facets become buttons; on every phone
// route there's no provider, the value is null, and the links are untouched.
// It also saves drilling the handler through RecordGrid, CoverFlow and
// ShuffleControl, none of which have any business knowing about it.

export type Facet =
  | { kind: "artist"; value: string }
  | { kind: "year"; value: number }
  | { kind: "genre"; value: string };

export const TabletShelfContext = createContext<((facet: Facet) => void) | null>(
  null
);

/** Null on every phone route — the caller should fall back to <Link>. */
export function useTabletShelf() {
  return useContext(TabletShelfContext);
}
