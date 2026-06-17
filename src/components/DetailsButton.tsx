"use client";

import { assetPath } from "@/lib/asset";

// The hand-drawn cardboard "•••" chip — the explicit "open details" affordance.
// Lives wherever a single cover is featured but tapping it to open isn't obvious
// (the shuffle reveal, the cover-flow strips). It mirrors the shuffle chip so the
// two read as a matched pair. NOT used in the dense scan grid, where every cover
// already opens its detail on tap.
export default function DetailsButton({
  onClick,
  size = "md",
  className = "",
}: {
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const dims = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="View details"
      className={`${dims} shrink-0 transition [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.55))] active:scale-95 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={assetPath("/ui/details.png")}
        alt=""
        draggable={false}
        className="h-full w-full select-none object-contain"
      />
    </button>
  );
}
