"use client";

import { useEffect } from "react";
import { type Album, COLLECTION_LABELS } from "@/lib/records";
import { getQuotes } from "@/lib/quotes";
import { assetPath } from "@/lib/asset";

export default function AlbumDetail({
  album,
  onClose,
}: {
  album: Album;
  onClose: () => void;
}) {
  const quotes = getQuotes(album.id);

  // Close on Escape, and lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(album.cover)}
          alt={`${album.title} by ${album.artist}`}
          className="mx-auto aspect-square w-56 rounded-xl object-cover shadow-xl"
        />
        <div className="mt-5 text-center">
          <h2 className="text-2xl font-semibold leading-tight">
            {album.title}
          </h2>
          <p className="mt-1 text-lg text-accent">{album.artist}</p>
          <p className="mt-1 text-sm text-muted">
            {COLLECTION_LABELS[album.collection]}
            {album.year ? ` · ${album.year}` : ""}
          </p>
        </div>

        {album.genres.length > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {album.genres.map((g) => (
              <span
                key={`g-${g}`}
                className="rounded-full bg-white/10 px-3 py-1 text-sm"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {quotes.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              What Reddit says
            </h3>
            <ul className="space-y-3 text-left">
              {quotes.map((q, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-white/5 px-4 py-3 text-[15px] leading-relaxed"
                >
                  <p>“{q.text}”</p>
                  <p className="mt-1.5 text-xs text-muted">r/{q.subreddit}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-accent py-3 font-medium text-black transition active:scale-95"
        >
          Back to the crate
        </button>
      </div>
    </div>
  );
}
