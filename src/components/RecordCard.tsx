"use client";

import { type Album } from "@/lib/records";
import { assetPath } from "@/lib/asset";

type Size = "grid" | "flow" | "mini";

// One cover+title+artist unit, so the scan grid and the Similar-vibes strip
// render covers identically (same radius, shadow, clamp, accent artist). Always
// a real <button> with an album-level aria-label — never a click-handled div.
const COVER: Record<Size, string> = {
  grid: "aspect-square w-full rounded-xl object-cover shadow-lg",
  flow: "aspect-square w-full rounded-xl object-cover shadow-2xl",
  mini: "aspect-square w-full rounded-lg object-cover shadow-lg",
};

const TITLE: Record<Size, string> = {
  grid: "text-[0.95rem]",
  flow: "text-base",
  mini: "text-[0.8rem]",
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
      <p className={`mt-2 line-clamp-1 font-display leading-tight ${TITLE[size]}`}>
        {album.title}
      </p>
      <p className="line-clamp-1 text-[0.8rem] text-accent">{album.artist}</p>
    </button>
  );
}
