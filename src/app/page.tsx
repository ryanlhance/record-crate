import Link from "next/link";
import { COLLECTIONS, getGenres } from "@/lib/records";

// Cohesive warm 70s record-store palette (no clashing rainbow).
const PALETTE = [
  "#E2833B", // orange
  "#C9543C", // rust
  "#D7A33C", // gold
  "#3E8E86", // teal
  "#9A8A3E", // olive
  "#B0623E", // clay
];
const ink = "#2a1a12";

export default function Home() {
  const genres = getGenres();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      {/* Hero */}
      <Link
        href="/all"
        className="group relative block overflow-hidden rounded-3xl px-6 py-9 transition active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg,#E2833B 0%,#C9543C 55%,#9A5A2E 100%)",
          color: "#fff4e6",
        }}
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border-[16px] border-black/10">
          <div className="absolute inset-9 rounded-full border-4 border-black/10" />
          <div className="absolute inset-[45%] rounded-full bg-black/20" />
        </div>
        <p className="font-display text-3xl leading-none">Explore</p>
        <p className="font-display text-3xl leading-tight">Ryan&apos;s Shelf</p>
        <p className="mt-3 inline-block rounded-full bg-black/15 px-3 py-1 text-sm font-semibold">
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
            style={{ background: PALETTE[i % PALETTE.length], color: ink }}
          >
            <span className="text-sm font-bold uppercase leading-tight tracking-wide">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {genres.map((g, i) => (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="flex min-h-[60px] items-center justify-center rounded-2xl p-2 text-center transition active:scale-[0.97]"
            style={{ background: PALETTE[(i + 2) % PALETTE.length], color: ink }}
          >
            <span className="text-xs font-bold uppercase tracking-wide">
              {g}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
