import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import { getByTag, getGenres, getVibes } from "@/lib/records";

export function generateStaticParams() {
  const tags = [...getGenres(), ...getVibes()];
  return tags.map((tag) => ({ tag: encodeURIComponent(tag.toLowerCase()) }));
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const albums = getByTag(decoded);

  if (albums.length === 0) notFound();

  // Show the tag with its original casing if we can find it.
  const display =
    [...getGenres(), ...getVibes()].find(
      (t) => t.toLowerCase() === decoded.toLowerCase()
    ) ?? decoded;

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
