"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import CoverFlow from "@/components/CoverFlow";
import SearchBar from "@/components/SearchBar";
import { search } from "@/lib/records";

export default function SearchResults() {
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const results = useMemo(() => search(query), [query]);

  return (
    <>
      <div className="mx-auto w-full max-w-xl px-6 pt-4">
        <SearchBar initialQuery={query} autoFocus />
      </div>
      {query.trim() === "" ? (
        <p className="px-6 py-20 text-center text-muted">
          Type an artist or album to search.
        </p>
      ) : results.length === 0 ? (
        <p className="px-6 py-20 text-center text-muted">
          No records match “{query}”.
        </p>
      ) : (
        <CoverFlow albums={results} />
      )}
    </>
  );
}
