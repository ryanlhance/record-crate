import Link from "next/link";
import { COLLECTIONS, getGenres } from "@/lib/records";

export default function Home() {
  const genres = getGenres();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-8">
      {/* Hero — the one red block */}
      <Link
        href="/all"
        className="block rounded-2xl bg-accent px-6 py-9 text-[#121110] transition active:scale-[0.98]"
      >
        <p className="font-display text-[2.6rem] leading-[0.95]">
          Explore
          <br />
          Ryan&apos;s Shelf
        </p>
        <p className="mt-4 text-sm font-semibold">
          Tap to flip through everything →
        </p>
      </Link>

      {/* Collections */}
      <p className="eyebrow mb-3 mt-9">Collections</p>
      <div className="grid grid-cols-3 gap-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.type}
            href={`/collection/${c.type}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-foreground p-2 text-center text-[#121110] transition active:scale-[0.97]"
          >
            <span className="font-display text-sm leading-[1.1] hyphens-auto [overflow-wrap:break-word]">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres */}
      <p className="eyebrow mb-3 mt-9">Genres</p>
      <div className="grid grid-cols-2 gap-3">
        {genres.map((g) => (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="flex min-h-[56px] items-center justify-center rounded-2xl border border-foreground/25 text-center transition active:scale-[0.98] active:border-accent"
          >
            <span className="font-display text-base">{g}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
