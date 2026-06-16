import Link from "next/link";
import { assetPath } from "@/lib/asset";

// Genre wall: hand-drawn marker-on-cardboard bin dividers, one image per genre
// (public/genre-labels/<genre>.png — real artwork, edge-to-edge). The image is
// the whole tab; we just frame it as a tappable link. aria-label carries the
// name since the lettering lives inside the image.
export default function GenreWall({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {genres.map((g) => (
        <Link
          key={g}
          href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
          aria-label={g}
          className="overflow-hidden rounded-[10px] transition active:scale-[0.97]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(`/genre-labels/${g.toLowerCase()}.png`)}
            alt=""
            draggable={false}
            className="aspect-[5/2] w-full select-none object-cover"
          />
        </Link>
      ))}
    </div>
  );
}
