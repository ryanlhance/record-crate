import CoverFlow from "@/components/CoverFlow";
import CrateHeader from "@/components/CrateHeader";
import { getAllAlbums } from "@/lib/records";

export default function AllPage() {
  const albums = getAllAlbums();

  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader
        title="The whole shelf"
        subtitle={`${albums.length} records · by artist`}
      />
      <CoverFlow albums={albums} />
    </main>
  );
}
