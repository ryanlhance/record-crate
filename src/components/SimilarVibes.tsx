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
  wide = false,
}: {
  album: Album;
  onSelect: (album: Album) => void;
  /** In the tablet sheet this sits in the metadata column beside the cover, so
   *  it fills that column and aligns left with it instead of staying a narrow
   *  centred strip adrift in the space. */
  wide?: boolean;
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
      <div
        className={`flex items-center gap-2 ${
          wide ? "justify-center lg:justify-start" : "justify-center"
        }`}
      >
        <Sparkle className="h-4 w-4 text-accent" aria-hidden="true" />
        <p className="eyebrow">Similar vibes</p>
      </div>

      {sharedTags.length > 0 && (
        <p
          className={`font-marker mt-2 text-lg leading-none text-muted ${
            wide ? "text-center lg:text-left" : "text-center"
          }`}
        >
          {sharedTags.join(" · ")}
        </p>
      )}

      {/* The three most similar, centered. No scroll — easy to take in at a glance. */}
      <div
        className={`mt-3 grid grid-cols-3 gap-3 ${
          wide
            ? // Left-aligned with the metadata column and a little wider, but
              // not stretched across it — the mini caption is sized for a small
              // cover and looks lost under a very large one.
              "mx-auto max-w-xs lg:mx-0 lg:max-w-md lg:gap-4"
            : "mx-auto max-w-xs"
        }`}
      >
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
