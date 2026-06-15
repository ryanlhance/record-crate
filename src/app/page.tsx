import Link from "next/link";
import { COLLECTIONS, getGenres } from "@/lib/records";

// Coordinated warm scheme: three tints of the orange accent for collections,
// dark chips with orange type for genres. One color family, not a rainbow.
const COLLECTION_COLORS = ["#ff7a3d", "#e2542f", "#f2a73c"];
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
          background: "linear-gradient(135deg,#ff7a3d 0%,#e2542f 55%,#8a3f22 100%)",
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
            style={{ background: COLLECTION_COLORS[i % 3], color: ink }}
          >
            <span className="text-sm font-bold uppercase leading-tight tracking-wide">
              {c.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Genres — two columns of five */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {genres.map((g) => (
          <Link
            key={g}
            href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
            className="flex min-h-[56px] items-center justify-center rounded-2xl border border-white/10 bg-card text-center text-accent transition active:scale-[0.98]"
          >
            <span className="text-sm font-bold uppercase tracking-wide">{g}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
