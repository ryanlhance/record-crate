import Link from "next/link";
import { COLLECTIONS, getAllAlbums, getGenres } from "@/lib/records";
import { ArrowRight } from "@/components/icons";
import GenreWall from "@/components/GenreWall";
import Spotlight from "@/components/Spotlight";
import ShuffleControl from "@/components/ShuffleControl";

export default function Home() {
  const genres = getGenres();
  const albums = getAllAlbums();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      {/* Hero — the red "Explore" block + a square Shuffle tile beside it.
          min-w-0 lets the red block actually shrink to share the row (otherwise
          the big headline's intrinsic width shoves the tile off-screen); the
          clamp keeps the headline fitting from small phones up to the max-w-xl
          desktop width. */}
      <div className="flex gap-3">
        <Link
          href="/all"
          className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-2xl bg-accent px-5 py-8 text-[#121110] transition active:scale-[0.98] sm:gap-4 sm:px-6 sm:py-9"
        >
          <p className="min-w-0 font-display text-[clamp(1.6rem,6.2vw,2.6rem)] leading-[1.02] sm:leading-[0.95]">
            Explore
            <br />
            Ryan&apos;s Shelf
          </p>
          {/* Hidden on the smallest phones, where the headline needs the full
              width of the (shrunken) red block; the block itself is the link. */}
          <ArrowRight className="hidden w-9 shrink-0 min-[375px]:block sm:w-[54px]" />
        </Link>
        <ShuffleControl albums={albums} variant="hero" />
      </div>

      {/* Spotlight — a fresh random cover-flow draw every load. No mt here: the
          cover-flow's own py-6 supplies the 24px gap so it matches the others. */}
      <Spotlight albums={albums} />

      {/* Collections */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.type}
            href={`/collection/${c.type}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-foreground p-1.5 text-center text-[#121110] transition active:scale-[0.97]"
          >
            <span className="font-display text-sm leading-tight">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Genres — the Sharpie bin-divider wall */}
      <div className="mt-6">
        <GenreWall genres={genres} />
      </div>
    </main>
  );
}
