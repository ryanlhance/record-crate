"use client";

import { type Album, getSimilar } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import RecordCard from "./RecordCard";
import { Sparkle } from "./icons";

// "If you like this, you'll probably dig these" — pulled from the same crate.
// The three most similar records, shown centered below the current selection.
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
  const results = getSimilar(album, 3);
  if (results.length === 0) return null;

  // The vibe tags shared across the shown neighbors — the "why these are
  // grouped" stamp. Empty in fallback mode (no vibe data yet), so it hides.
  const sharedTags = [...new Set(results.flatMap((r) => r.sharedVibes))];

  return (
    <section
      aria-label="Similar vibes"
      className="mt-6 border-t border-white/10 pt-4"
    >
      <div className="flex items-center justify-center gap-2">
        <Sparkle className="h-4 w-4 text-accent" aria-hidden="true" />
        <p className="eyebrow">Similar vibes</p>
      </div>

      {sharedTags.length > 0 && (
        <p className="font-marker mt-2 text-center text-lg leading-none text-muted">
          {sharedTags.join(" · ")}
        </p>
      )}

      {/* The three most similar, centered. No scroll — easy to take in at a glance. */}
      <div className="mx-auto mt-3 grid max-w-xs grid-cols-3 gap-3">
        {results.map((r, i) => (
          <div
            key={r.album.id}
            className={reduced ? undefined : "cover-in"}
            style={reduced ? undefined : { animationDelay: `${i * 40}ms` }}
          >
            <RecordCard album={r.album} size="mini" onSelect={onSelect} />
          </div>
        ))}
      </div>
    </section>
  );
}
