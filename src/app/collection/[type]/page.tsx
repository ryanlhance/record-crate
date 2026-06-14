import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import {
  COLLECTION_LABELS,
  COLLECTIONS,
  getByCollection,
  isCollectionType,
} from "@/lib/records";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ type: c.type }));
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!isCollectionType(type)) notFound();

  const albums = getByCollection(type);

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={COLLECTION_LABELS[type]}
        subtitle={`${albums.length} records · by artist`}
      />
      <CoverFlow albums={albums} />
    </main>
  );
}
