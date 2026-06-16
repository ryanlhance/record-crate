import Link from "next/link";
import { COLLECTIONS, getAllAlbums, getGenres } from "@/lib/records";
import { ArrowRight } from "@/components/icons";
import GenreWall from "@/components/GenreWall";
import Spotlight from "@/components/Spotlight";

export default function Home() {
  const genres = getGenres();
  const albums = getAllAlbums();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      {/* Hero — the one red "Explore" block. Full width: the point of the home
          screen is exploring the shelf, so Shuffle lives on the browsing pages
          rather than competing here. */}
      <Link
        href="/all"
        className="flex items-center justify-between gap-4 rounded-2xl bg-accent px-6 py-9 text-[#121110] transition active:scale-[0.98]"
      >
        <p className="font-display text-[2.6rem] leading-[0.95]">
          Explore
          <br />
          Ryan&apos;s Shelf
        </p>
        <ArrowRight className="shrink-0" />
      </Link>

      {/* Spotlight — a fresh random cover-flow draw every load */}
      <div className="mt-6">
        <Spotlight albums={albums} />
      </div>

      {/* Genres — the hand-drawn cardboard bin-divider wall */}
      <div className="mt-6">
        <GenreWall genres={genres} />
      </div>

      {/* Collections — below the genres */}
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
    </main>
  );
}
