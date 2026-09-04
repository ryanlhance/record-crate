"use client";

import { type Album } from "@/lib/records";
import { assetPath } from "@/lib/asset";

type Size = "grid" | "flow" | "mini" | "ipad";

// One cover+title+artist unit, so the scan grid and the Similar-vibes strip
// render covers identically (same radius, shadow, clamp, accent artist). Always
// a real <button> with an album-level aria-label — never a click-handled div.
//
// "ipad" is the same card sized for arm's-length reading on a tablet: a wider
// corner radius to match the bigger cover, and type that doesn't shrink to
// phone scale on a 1180px-wide shelf.
const COVER: Record<Size, string> = {
  grid: "aspect-square w-full rounded-xl object-cover shadow-lg",
  flow: "aspect-square w-full rounded-xl object-cover shadow-2xl",
  mini: "aspect-square w-full rounded-lg object-cover shadow-lg",
  ipad: "aspect-square w-full rounded-2xl object-cover shadow-xl",
};

const TITLE: Record<Size, string> = {
  grid: "text-[0.95rem]",
  flow: "text-base",
  mini: "text-[0.8rem]",
  ipad: "text-base lg:text-[1.05rem]",
};

const ARTIST: Record<Size, string> = {
  grid: "text-[0.8rem]",
  flow: "text-[0.8rem]",
  mini: "text-[0.8rem]",
  ipad: "text-[0.85rem] lg:text-[0.95rem]",
};

export default function RecordCard({
  album,
  size = "grid",
  onSelect,
  eager = false,
  className = "",
}: {
  album: Album;
  size?: Size;
  onSelect: (album: Album) => void;
  /** First few above-the-fold covers load eagerly so the grid paints fast. */
  eager?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(album)}
      aria-label={`${album.title} by ${album.artist}`}
      className={`group block text-left transition active:scale-[0.97] focus-visible:outline-none ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath(album.cover)}
        alt=""
        loading={eager ? "eager" : "lazy"}
        draggable={false}
        className={`select-none ${COVER[size]} ring-accent ring-offset-2 ring-offset-background group-focus-visible:ring-2`}
      />
      <p
        className={`mt-2 font-display leading-tight ${
          size === "ipad" ? "line-clamp-2" : "line-clamp-1"
        } ${TITLE[size]}`}
      >
        {album.title}
      </p>
      <p
        className={`text-accent ${
          size === "ipad" ? "line-clamp-2" : "line-clamp-1"
        } ${ARTIST[size]}`}
      >
        {album.artist}
      </p>
    </button>
  );
}
