import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import { getByGenre, getGenres } from "@/lib/records";

export function generateStaticParams() {
  return getGenres().map((g) => ({ tag: encodeURIComponent(g.toLowerCase()) }));
}

export default async function GenrePage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const albums = getByGenre(decoded);

  if (albums.length === 0) notFound();

  // Show the genre with its original casing.
  const display =
    getGenres().find((g) => g.toLowerCase() === decoded.toLowerCase()) ??
    decoded;

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={display}
        subtitle={`${albums.length} records · by artist`}
      />
      <CoverFlow albums={albums} />
    </main>
  );
}
