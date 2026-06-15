import Link from "next/link";
import { COLLECTIONS, getGenres } from "@/lib/records";

// Funky record-store palette, cycled across the genre cards.
const FUNKY = [
  "#ff7a3d", "#e84a7f", "#2bb3a3", "#e8b53d",
  "#8b6cf0", "#e2543b", "#7bb53a", "#3a9bc8",
];
const ink = "#17100f";

export default function Home() {
  const genres = getGenres();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
      {/* Hero: Explore the whole shelf */}
      <Link
        href="/all"
        className="group relative block overflow-hidden rounded-3xl px-6 py-8 transition active:scale-[0.98]"
        style={{
          background: "linear-gradient(135deg, #ff7a3d 0%, #e84a7f 60%, #8b6cf0 100%)",
          color: ink,
        }}
      >
        {/* spinning-record motif */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border-[14px] border-black/15">
          <div className="absolute inset-8 rounded-full border-4 border-black/15" />
          <div className="absolute inset-[44%] rounded-full bg-black/25" />
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
            className="flex aspect-square flex-col justify-end rounded-2xl p-3 transition active:scale-[0.97]"
            style={{ background: FUNKY[(i + 3) % FUNKY.length], color: ink }}
          >
            <span className="font-display text-sm leading-[1.05] [overflow-wrap:anywhere]">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {genres.map((g, i) => (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="flex min-h-[64px] items-center justify-center rounded-2xl p-2 text-center transition active:scale-[0.97]"
            style={{ background: FUNKY[i % FUNKY.length], color: ink }}
          >
            <span className="font-display text-xs leading-[1.05] [overflow-wrap:anywhere]">
              {g}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
