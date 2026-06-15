import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import { getArtists, getByArtistSlug } from "@/lib/records";

export function generateStaticParams() {
  return getArtists().map((a) => ({ slug: a.slug }));
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const albums = getByArtistSlug(slug);
  if (albums.length === 0) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={albums[0].artist}
        subtitle={`${albums.length} record${albums.length === 1 ? "" : "s"}`}
      />
      <CoverFlow albums={albums} />
    </main>
  );
}
