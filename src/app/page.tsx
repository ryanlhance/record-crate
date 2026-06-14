import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import { COLLECTIONS, getByCollection, getAllAlbums } from "@/lib/records";

export default function Home() {
  const total = getAllAlbums().length;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">The Crate</h1>
        <p className="mt-2 text-muted">
          {total} records. Flip through and pick something to play.
        </p>
      </header>

      <div className="mt-8">
        <SearchBar />
      </div>

      <section className="mt-8">
        <Link
          href="/all"
          className="flex items-center justify-between rounded-2xl bg-accent px-5 py-5 text-black transition active:scale-[0.98]"
        >
          <span className="text-lg font-semibold">
            Flip through the whole shelf
          </span>
          <span className="text-sm font-medium">{total} →</span>
        </Link>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Browse by collection
        </h2>
        <div className="grid gap-3">
          {COLLECTIONS.map((c) => {
            const count = getByCollection(c.type).length;
            return (
              <Link
                key={c.type}
                href={`/collection/${c.type}`}
                className="flex items-center justify-between rounded-2xl bg-card px-5 py-4 transition active:scale-[0.98]"
              >
                <span className="text-lg font-medium">{c.label}</span>
                <span className="text-sm text-muted">{count} →</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Browse by genre
        </h2>
        <Link
          href="/browse"
          className="flex items-center justify-between rounded-2xl border border-accent/40 px-5 py-4 transition active:scale-[0.98]"
        >
          <span className="text-lg font-medium text-accent">Pick a genre</span>
          <span className="text-sm text-muted">→</span>
        </Link>
      </section>
    </main>
  );
}
