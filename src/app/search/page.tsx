import { Suspense } from "react";
import CrateHeader from "@/components/CrateHeader";
import SearchResults from "@/components/SearchResults";

export default function SearchPage() {
  return (
    <main className="flex flex-1 flex-col">
      <CrateHeader title="Search" />
      <Suspense>
        <SearchResults />
      </Suspense>
    </main>
  );
}
