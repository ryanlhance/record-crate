import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import { getAllAlbums } from "@/lib/records";

export default function AllPage() {
  const albums = getAllAlbums();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title="Ryan's Shelf"
        subtitle="Tap an album cover to see more"
      />
      <CoverFlow albums={albums} />
    </main>
  );
}
