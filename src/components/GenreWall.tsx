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

export default function GenreWall({
  genres,
  onSelect,
  active,
  className = "grid grid-cols-2 gap-3",
}: {
  genres: string[];
  /** Filter-in-place mode (the iPad rail): render buttons that call back
   *  instead of links that navigate. Omit it and the wall behaves exactly as
   *  it always has — one route per genre. */
  onSelect?: (genre: string) => void;
  /** Currently-selected genre, highlighted. Only meaningful with `onSelect`. */
  active?: string | null;
  /** Lets a caller lay the dividers out differently — a single stacked column
   *  in the tablet rail, the original two-up on the phone home screen. */
  className?: string;
}) {
  return (
    <div className={className}>
      {genres.map((g) => {
        const slug = genreSlug(g);
        const isActive = onSelect != null && active === g;

        // The dividers are art, so "selected" reads as a lit brass frame around
        // the tab — the divider you pulled forward — rather than a tint over
        // the artwork. The others fall back only while one IS pulled forward;
        // with nothing selected the wall sits at full strength.
        const somethingActive = onSelect != null && active != null;
        const frame = isActive
          ? "ring-2 ring-accent ring-offset-2 ring-offset-background"
          : somethingActive
            ? "opacity-45 hover:opacity-90"
            : "";

        const inner = !ART.has(slug) ? (
          // Kraft marker tab, sized to match the artwork so the wall stays aligned.
          <span className="flex aspect-[5/2] items-center justify-center rounded-[10px] bg-[#c9a980] text-[#2b2723]">
            <span className="font-marker text-2xl leading-none">{g}</span>
          </span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={assetPath(`/genre-labels/${slug}.png`)}
            alt=""
            draggable={false}
            className="aspect-[5/2] w-full select-none rounded-[10px] object-cover"
          />
        );

        const shared = `block overflow-hidden rounded-[10px] transition active:scale-[0.97] ${frame}`;

        return onSelect ? (
          <button
            key={g}
            type="button"
            onClick={() => onSelect(g)}
            aria-label={g}
            aria-pressed={isActive}
            className={`${shared} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
          >
            {inner}
          </button>
        ) : (
          <Link
            key={g}
            href={`/browse/${slug}`}
            aria-label={g}
            className={shared}
          >
            {inner}
          </Link>
        );
      })}
    </div>
  );
}
