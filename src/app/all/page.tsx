import RecordGrid from "@/components/RecordGrid";
import CrateHeader from "@/components/CrateHeader";
import ShuffleControl from "@/components/ShuffleControl";
import { getAllAlbums } from "@/lib/records";

export default function AllPage() {
  const albums = getAllAlbums();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader title="Ryan's Shelf" subtitle={`${albums.length} records`} sticky />
      <RecordGrid albums={albums} />
      <ShuffleControl albums={albums} />
    </main>
  );
}
