import type { Metadata, Viewport } from "next";
import { getGenres } from "@/lib/records";
import IpadShelf from "@/components/ipad/IpadShelf";

// The tablet build of the crate, at /ipad-records. Landscape-first, portrait
// supported. It reuses the phone app wholesale — same records.json, same cover
// and bin-divider artwork, same RecordCard / CoverFlow / AlbumDetail /
// PreviewButton / ShuffleControl, and the same savor-or-scan rule from
// lib/records. What changes is navigation, which is the one thing a tablet
// actually changes. See IpadShelf for the reasoning.

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
  return <IpadShelf genres={getGenres()} />;
}
