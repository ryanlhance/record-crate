import Link from "next/link";
import CrateHeader from "@/components/CrateHeader";
import { getGenres, getVibes } from "@/lib/records";

function TagGrid({ label, tags }: { label: string; tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
        {label}
      </h2>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/browse/${encodeURIComponent(tag.toLowerCase())}`}
            className="rounded-full bg-card px-4 py-2 text-base transition active:scale-95"
          >
            {tag}
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function BrowsePage() {
  const genres = getGenres();
  const vibes = getVibes();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader title="By genre or vibe" />
      <div className="mx-auto w-full max-w-xl px-6 pb-12">
        <TagGrid label="Vibes" tags={vibes} />
        <TagGrid label="Genres" tags={genres} />
      </div>
    </main>
  );
}
