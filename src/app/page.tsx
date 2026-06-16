import Link from "next/link";
import { COLLECTIONS, getAllAlbums, getGenres } from "@/lib/records";
import { assetPath } from "@/lib/asset";
import GenreWall from "@/components/GenreWall";
import Spotlight from "@/components/Spotlight";

export default function Home() {
  const genres = getGenres();
  const albums = getAllAlbums();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      {/* Hero — the hand-painted "Ryan's Collection" shop sign; the whole block
          is the link into the shelf. */}
      <Link
        href="/all"
        aria-label="Explore Ryan's Collection"
        className="block overflow-hidden rounded-2xl transition active:scale-[0.98]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath("/ui/hero.png")}
          alt=""
          className="aspect-[2/1] w-full select-none object-cover"
        />
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
