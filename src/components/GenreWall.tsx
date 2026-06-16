import Link from "next/link";
import type { CSSProperties } from "react";
import { MarkerUnderline } from "./icons";

// Interim genre wall while real hand-drawn label images are produced. Cleaned
// up per feedback: one consistent black marker ink (no random per-genre colors),
// all tabs the same flat orientation (no random tilt), and no doodles. The
// chipboard card + marker font + underline stay so it still reads as a record-
// shop bin divider. To be replaced by image-based buttons once art lands.
const INK = "var(--ink-black)";

export default function GenreWall({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {genres.map((g) => (
        <Link
          key={g}
          href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
          className="group relative flex min-h-[64px] items-center justify-center overflow-hidden rounded-[10px] border border-black/10 bg-[var(--chipboard)] px-4 py-3 transition active:scale-[0.97]"
          style={{ color: INK } as CSSProperties}
        >
          <span className="font-marker text-2xl leading-none">{g}</span>
          <MarkerUnderline className="pointer-events-none absolute bottom-2 left-1/2 h-2 w-3/5 -translate-x-1/2 opacity-90" />
        </Link>
      ))}
    </div>
  );
}
