"use client";

import { type Album, getSimilar } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import RecordCard from "./RecordCard";
import { Sparkle } from "./icons";

// "If you like this, you'll probably dig these" — pulled from the same crate.
// A compact, edge-bleeding horizontal row of 4–8 related covers below the pills.
// Tapping a neighbor swaps the sheet's album in place (via onSelect) so you can
// wander album → album → album. Hides entirely when there are no matches.
export default function SimilarVibes({
  album,
  onSelect,
}: {
  album: Album;
  onSelect: (album: Album) => void;
}) {
  const reduced = useReducedMotion();
  const results = getSimilar(album, 8);
  if (results.length === 0) return null;

  // The vibe tags shared across the shown neighbors — the "why these are
  // grouped" stamp. Empty in fallback mode (no vibe data yet), so it hides.
  const sharedTags = [...new Set(results.flatMap((r) => r.sharedVibes))];

  return (
    <section
      aria-label="Similar vibes"
      className="mt-6 border-t border-white/10 pt-4"
    >
      <div className="flex items-center gap-2">
        <Sparkle className="h-4 w-4 text-accent" aria-hidden="true" />
        <p className="eyebrow">Similar vibes</p>
      </div>

      {sharedTags.length > 0 && (
        <p className="font-marker mt-2 text-lg leading-none text-muted">
          {sharedTags.join(" · ")}
        </p>
      )}

      {/* Edge-bleeds off the right (negative margin + padding) so it's obviously
          scrollable. */}
      <div className="-mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-1">
        {results.map((r, i) => (
          <div
            key={r.album.id}
            className={`w-24 shrink-0 ${reduced ? "" : "cover-in"}`}
            style={reduced ? undefined : { animationDelay: `${Math.min(i, 8) * 30}ms` }}
          >
            <RecordCard album={r.album} size="mini" onSelect={onSelect} />
          </div>
        ))}
      </div>
    </section>
  );
}
