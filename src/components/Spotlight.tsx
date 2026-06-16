"use client";

import { useEffect, useState } from "react";
import { type Album, getRandomSet } from "@/lib/records";
import CoverFlow from "./CoverFlow";

// A randomized cover-flow strip on the home screen — 6–8 covers drawn fresh
// from the whole library every load, so the landing screen never looks the same
// twice and the signature hinge stays front-and-center.
//
// Static-export caveat: the random draw MUST happen client-side after mount,
// or server and client HTML disagree and React throws a hydration mismatch.
// So we render a skeleton on first paint, then shuffle in.
export default function Spotlight({ albums }: { albums: Album[] }) {
  const [picks, setPicks] = useState<Album[] | null>(null);

  useEffect(() => {
    // 6–8 covers, redrawn on every mount.
    const n = 6 + Math.floor(Math.random() * 3);
    setPicks(getRandomSet(albums, n));
  }, [albums]);

  return (
    <section aria-label="Spotlight">
      <p className="eyebrow mt-7 mb-2">Spotlight</p>
      {picks ? (
        <CoverFlow albums={picks} variant="compact" />
      ) : (
        // Skeleton sized to the compact flow so there's no layout shift.
        <div
          className="flex flex-col items-center py-6"
          aria-hidden="true"
        >
          <div className="aspect-square w-[46vw] max-w-[11rem] animate-pulse rounded-xl bg-card" />
          <div className="mt-3 h-14" />
        </div>
      )}
    </section>
  );
}
