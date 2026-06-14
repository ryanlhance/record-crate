"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  initialQuery = "",
  autoFocus = false,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = value.trim();
        if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
      role="search"
    >
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search artist or album…"
        aria-label="Search the collection"
        className="w-full rounded-full border border-white/15 bg-card px-5 py-3 text-base outline-none placeholder:text-muted focus:border-accent"
      />
    </form>
  );
}
