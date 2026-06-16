import Link from "next/link";
import { assetPath } from "@/lib/asset";
import { genreSlug } from "@/lib/records";

// Genre wall: hand-drawn marker-on-cardboard bin dividers, one image per genre
// (public/genre-labels/<slug>.png). The image is the whole tab; we frame it as a
// tappable link with an aria-label for the name.
//
// ART lists the genres that have real artwork. Any genre without art (e.g. a
// brand-new one) renders a marker text tab instead — add its slug here once the
// image is dropped in. (Driven by a set, not <img> onError, because the broken-
// image event fires before hydration and would never reach React.)
const ART = new Set([
  "disco",
  "experimental",
  "funk",
  "jazz",
  "lounge",
  "rnb",
  "rock",
  "soul",
]);

export default function GenreWall({ genres }: { genres: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {genres.map((g) => {
        const slug = genreSlug(g);
        const href = `/browse/${slug}`;

        if (!ART.has(slug)) {
          // Kraft marker tab, sized to match the artwork so the wall stays aligned.
          return (
            <Link
              key={g}
              href={href}
              aria-label={g}
              className="flex aspect-[5/2] items-center justify-center rounded-[10px] bg-[#c9a980] text-[#2b2723] transition active:scale-[0.97]"
            >
              <span className="font-marker text-2xl leading-none">{g}</span>
            </Link>
          );
        }

        return (
          <Link
            key={g}
            href={href}
            aria-label={g}
            className="overflow-hidden rounded-[10px] transition active:scale-[0.97]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetPath(`/genre-labels/${slug}.png`)}
              alt=""
              draggable={false}
              className="aspect-[5/2] w-full select-none object-cover"
            />
          </Link>
        );
      })}
    </div>
  );
}
