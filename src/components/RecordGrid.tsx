"use client";

import { useState } from "react";
import { type Album } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import RecordCard from "./RecordCard";
import AlbumDetail from "./AlbumDetail";
import { Vinyl } from "./icons";

// The scan surface: a two-column grid of covers for the big, exploratory sets.
// Tapping a cell opens the SAME AlbumDetail sheet the cover-flow uses (reused,
// not forked). Covers fade+rise in a short, capped stagger.
export default function RecordGrid({ albums }: { albums: Album[] }) {
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

  return (
    <div className="flex-1">
      {/* Generous bottom padding so the last row clears the fixed Shuffle pill. */}
      <div className="grid grid-cols-2 gap-3 px-5 pb-32 pt-2">
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
            <RecordCard album={album} size="grid" eager={i < 6} onSelect={setSelected} />
          </div>
        ))}
      </div>

      {selected && (
        <AlbumDetail album={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
