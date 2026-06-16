import Link from "next/link";
import type { CSSProperties } from "react";
import { inkFor, tiltFor, doodleFor, doodleKindFor } from "@/lib/sharpie";
import { MarkerUnderline, DoodleStar, DoodleDisc } from "./icons";

// The genre block reskinned as a wall of hand-drawn Sharpie bin dividers, like
// marker-on-chipboard tabs in a real record store. Every label is generated
// from the genre name alone — marker text + a deterministic ink + a hand
// underline + a stable tilt + a sparse doodle (no per-genre image files).
// The underline/doodle SVGs use currentColor, so they inherit each tab's ink.
export default function GenreWall({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {genres.map((g) => {
        const ink = inkFor(g);
        const Doodle = doodleKindFor(g) === "star" ? DoodleStar : DoodleDisc;
        return (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="sharpie-tab group relative flex min-h-[64px] items-center justify-center overflow-hidden rounded-[10px] border border-black/10 bg-[var(--chipboard)] px-4 py-3"
            style={{ "--tilt": `${tiltFor(g)}deg`, color: ink } as CSSProperties}
          >
            <span className="font-marker text-2xl leading-none">{g}</span>
            <MarkerUnderline className="pointer-events-none absolute bottom-2 left-1/2 h-2 w-3/5 -translate-x-1/2 opacity-90" />
            {doodleFor(g) && (
              <Doodle className="pointer-events-none absolute right-2 top-2 h-4 w-4 opacity-80" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
