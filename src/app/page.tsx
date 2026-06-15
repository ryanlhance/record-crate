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
        <svg
          width="52"
          height="26"
          viewBox="0 0 52 26"
          fill="none"
          className="mt-5"
          aria-hidden="true"
        >
          <path
            d="M2 13 H47 M36 3 L48 13 L36 23"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      {/* Collections */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {COLLECTIONS.map((c) => (
          <Link
            key={c.type}
            href={`/collection/${c.type}`}
            className="flex aspect-square items-center justify-center rounded-2xl bg-foreground p-2 text-center text-[#121110] transition active:scale-[0.97]"
          >
            <span className="font-display text-xs leading-[1.15]">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres */}
      <div className="mt-3 grid grid-cols-2 gap-3">
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
