import type { Metadata, Viewport } from "next";
import { getAllAlbums, getGenres } from "@/lib/records";
import IpadShelf from "@/components/ipad/IpadShelf";

// The tablet build of the crate, at /ipad-records. Landscape-first, portrait
// supported. It reuses the phone app wholesale — same records.json, same cover
// art and bin-divider artwork, same RecordCard / AlbumDetail / PreviewButton /
// ShuffleControl — and only changes how much room they get. Nothing about the
// collection is duplicated here; see IpadShelf for the layout reasoning.

export const metadata: Metadata = {
  title: "Ryan's Records — iPad",
  description: "Ryan's record shelf, sized for a tablet.",
};

export const viewport: Viewport = {
  themeColor: "#15110c",
  // Landscape and portrait both render from the device width; nothing here
  // locks orientation or blocks pinch-zoom.
  width: "device-width",
  initialScale: 1,
};

export default function IpadRecordsPage() {
  return <IpadShelf all={getAllAlbums()} genres={getGenres()} />;
}
