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
      {/* Hero — the red "Explore" block + a square Shuffle tile beside it */}
      <div className="flex gap-3">
        <Link
          href="/all"
          className="flex flex-1 items-center justify-between gap-4 rounded-2xl bg-accent px-6 py-9 text-[#121110] transition active:scale-[0.98]"
        >
          <p className="font-display text-[2.6rem] leading-[0.95]">
            Explore
            <br />
            Ryan&apos;s Shelf
          </p>
          <ArrowRight className="shrink-0" />
        </Link>
        <ShuffleControl albums={albums} variant="hero" />
      </div>

      {/* Spotlight — a fresh random cover-flow draw every load */}
      <Spotlight albums={albums} />

      {/* Collections */}
      <p className="eyebrow mt-7 mb-2">Collections</p>
      <div className="grid grid-cols-3 gap-3">
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
      <p className="eyebrow mt-7 mb-2">By genre</p>
      <GenreWall genres={genres} />
    </main>
  );
}
