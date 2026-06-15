import Link from "next/link";
import { COLLECTIONS, getGenres } from "@/lib/records";

// A small, coordinated vintage trio (terracotta, gold, teal) for the collections.
const COLLECTION_COLORS = ["#bf5a3c", "#c8902f", "#357f72"];

export default function Home() {
  const genres = getGenres();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      {/* Hero */}
      <Link
        href="/all"
        className="group relative block overflow-hidden rounded-3xl px-6 py-10 transition active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg,#3f8a7c 0%,#2f6f63 100%)",
          color: "#fdf6ea",
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border-[16px] border-black/10">
          <div className="absolute inset-9 rounded-full border-4 border-black/10" />
          <div className="absolute inset-[45%] rounded-full bg-black/20" />
        </div>
        <p className="font-display text-4xl italic leading-[1.05]">
          Explore Ryan&apos;s Shelf
        </p>
        <p className="mt-3 inline-block rounded-full bg-black/15 px-3 py-1 text-sm font-medium">
          Tap to flip through everything →
        </p>
      </Link>

      {/* Collections */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {COLLECTIONS.map((c, i) => (
          <Link
            key={c.type}
            href={`/collection/${c.type}`}
            className="flex aspect-square items-end rounded-2xl p-3 transition active:scale-[0.97]"
            style={{ background: COLLECTION_COLORS[i % 3], color: "#fdf6ea" }}
          >
            <span className="font-display text-base font-semibold leading-tight">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres — two columns */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {genres.map((g) => (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="flex min-h-[52px] items-center justify-center rounded-2xl border border-white/10 bg-card text-center transition active:scale-[0.98]"
          >
            <span className="font-display text-base">{g}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
