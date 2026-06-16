import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import RecordGrid from "@/components/RecordGrid";
import CrateHeader from "@/components/CrateHeader";
import ShuffleControl from "@/components/ShuffleControl";
import { getByGenre, getGenres, genreSlug, genreFromSlug } from "@/lib/records";

export function generateStaticParams() {
  // Clean, URL-safe slugs only (no "&" etc. that break static-export folders).
  return getGenres().map((g) => ({ tag: genreSlug(g) }));
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const display = genreFromSlug(decodeURIComponent(tag));
  if (!display) notFound();

  const albums = getByGenre(display);
  if (albums.length === 0) notFound();

  // Cover-flow = savor one, grid = scan many. Genre bins are for scanning, so
  // the big ones become a grid; a small genre stays a delightful hinge.
  const useGrid = albums.length > 12;

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={display}
        subtitle={`${albums.length} records`}
        sticky={useGrid}
      />
      {useGrid ? <RecordGrid albums={albums} /> : <CoverFlow albums={albums} />}
      <ShuffleControl albums={albums} />
    </main>
  );
}
