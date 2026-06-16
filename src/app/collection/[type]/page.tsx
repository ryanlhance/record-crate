import { notFound } from "next/navigation";
import CoverFlow from "@/components/CoverFlow";
import RecordGrid from "@/components/RecordGrid";
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

  // Special + Compilations are curated show-pieces — each pressing earns a hinge
  // moment and its `edition` note (which only the cover-flow caption shows), so
  // they keep CoverFlow regardless of count. Only the big "main" shelf scans as
  // a grid (the >12 heuristic from 01).
  const useGrid = type === "main" && albums.length > 12;

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title={COLLECTION_LABELS[type]}
        subtitle={`${albums.length} records`}
        sticky={useGrid}
      />
      {useGrid ? <RecordGrid albums={albums} /> : <CoverFlow albums={albums} />}
    </main>
  );
}
