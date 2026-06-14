import Link from "next/link";
import CrateHeader from "@/components/CrateHeader";
import { getGenres } from "@/lib/records";

export default function BrowsePage() {
  const genres = getGenres();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader title="By genre" />
      <div className="mx-auto w-full max-w-xl px-6 pb-12">
        <div className="mt-6 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Link
              key={genre}
              href={`/browse/${encodeURIComponent(genre.toLowerCase())}`}
              className="rounded-full bg-card px-4 py-2 text-base transition active:scale-95"
            >
              {genre}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
