"use client";

import { type ReactNode, useState } from "react";
import { type Album } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import RecordCard from "./RecordCard";
import AlbumDetail from "./AlbumDetail";
import { Vinyl } from "./icons";

// The scan surface: a two-column grid of covers for the big, exploratory sets.
// Tapping a cell opens the SAME AlbumDetail sheet the cover-flow uses (reused,
// not forked). Covers fade+rise in a short, capped stagger.
//
// `variant` only changes how many covers sit across and how big they are —
// "phone" is the original two-up; "ipad" opens out to as many as six across on
// a landscape tablet and opens the detail in its side-by-side layout. Same
// component, same selection behaviour, same sheet.
type Variant = "phone" | "ipad";

const GRID: Record<Variant, string> = {
  phone: "grid-cols-2 gap-3 px-5 pb-32 pt-2",
  // Four across on a 1024pt iPad turned sideways gives ~175px covers — big
  // enough to read the sleeve from arm's length, which five across doesn't.
  ipad: "grid-cols-3 gap-5 px-6 pb-40 pt-3 md:grid-cols-4 lg:gap-6 lg:px-8 xl:grid-cols-5 2xl:grid-cols-6",
};

// How many covers get loading="eager" — roughly one screenful, so the first
// paint isn't waiting on lazy images that are already in view.
const EAGER: Record<Variant, number> = { phone: 6, ipad: 12 };

export default function RecordGrid({
  albums,
  variant = "phone",
  leading,
}: {
  albums: Album[];
  variant?: Variant;
  /** Rendered as the first tile of the grid, sized like a cover. The tablet
   *  puts Shuffle here: a wall of artwork swallows a small chip floating at the
   *  bottom of the page. */
  leading?: ReactNode;
}) {
  const [selected, setSelected] = useState<Album | null>(null);
  const reduced = useReducedMotion();

  if (albums.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center text-muted">
        <Vinyl className="h-12 w-12 opacity-40" />
        <p>Nothing here yet.</p>
      </div>
    );
  }

  const ipad = variant === "ipad";

  return (
    <div className="flex-1">
      {/* Generous bottom padding so the last row clears the fixed Shuffle pill. */}
      <div className={`grid ${GRID[variant]}`}>
        {leading}
        {albums.map((album, i) => (
          <div
            key={album.id}
            className={reduced ? undefined : "cover-in"}
            style={
              reduced
                ? undefined
                : // 10ms/item, capped at 14 items so the last cover isn't slow.
                  { animationDelay: `${Math.min(i, 14) * 10}ms` }
            }
          >
            <RecordCard
              album={album}
              size={ipad ? "ipad" : "grid"}
              eager={i < EAGER[variant]}
              onSelect={setSelected}
            />
          </div>
        ))}
      </div>

      {selected && (
        <AlbumDetail
          album={selected}
          wide={ipad}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
