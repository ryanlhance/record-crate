"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Album,
  COLLECTION_LABELS,
  artistHasMultiple,
  slugifyArtist,
} from "@/lib/records";
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
  const [showReactions, setShowReactions] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

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

  // Swipe-the-card-down to dismiss (the grab handle is the affordance).
  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  };
  const onPointerUp = () => {
    if (dragY > 110) onClose();
    else setDragY(0);
    startY.current = null;
    setDragging(false);
  };

  const artistMultiple = artistHasMultiple(album.artist);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-card p-6 pt-2 shadow-2xl sm:max-h-[88vh] sm:rounded-3xl"
        style={{
          transform: `translateY(${dragY}px)`,
          transition: dragging ? "none" : "transform 0.25s ease",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Grab handle — drag down to dismiss */}
        <div
          className="-mx-6 mb-3 flex cursor-grab touch-none justify-center py-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="h-1.5 w-12 rounded-full bg-white/25" />
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(album.cover)}
          alt={`${album.title} by ${album.artist}`}
          className="mx-auto aspect-square w-56 rounded-xl object-cover shadow-xl"
        />

        <div className="mt-5 text-center">
          <h2 className="text-2xl font-bold leading-tight">{album.title}</h2>
          {artistMultiple ? (
            <Link
              href={`/artist/${slugifyArtist(album.artist)}`}
              className="mt-1 inline-block text-lg text-accent underline decoration-accent/40 underline-offset-4"
            >
              {album.artist}
            </Link>
          ) : (
            <p className="mt-1 text-lg text-accent">{album.artist}</p>
          )}
        </div>

        {/* Tappable facets: collection · year · genres */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            href={`/collection/${album.collection}`}
            className="rounded-full bg-white/10 px-3 py-1 text-sm transition active:scale-95"
          >
            {COLLECTION_LABELS[album.collection]}
          </Link>
          {album.year && (
            <Link
              href={`/year/${album.year}`}
              className="rounded-full bg-white/10 px-3 py-1 text-sm transition active:scale-95"
            >
              {album.year}
            </Link>
          )}
          {album.genres.map((g) => (
            <Link
              key={g}
              href={`/browse/${encodeURIComponent(g.toLowerCase())}`}
              className="rounded-full border border-accent/50 px-3 py-1 text-sm text-accent transition active:scale-95"
            >
              {g}
            </Link>
          ))}
        </div>

        {/* Reddit reactions — collapsed by default */}
        {quotes.length > 0 && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <button
              onClick={() => setShowReactions((v) => !v)}
              className="flex w-full items-center justify-between gap-3 text-left"
              aria-expanded={showReactions}
            >
              <span className="text-base font-bold leading-tight">
                How People Feel About This Album
              </span>
              <span
                className="shrink-0 text-2xl leading-none text-accent transition-transform"
                style={{
                  transform: showReactions ? "rotate(180deg)" : "none",
                }}
              >
                ▾
              </span>
            </button>
            {showReactions && (
              <ul className="mt-3 space-y-3 text-left">
                {quotes.map((q, i) => (
                  <li
                    key={i}
                    className="rounded-xl bg-white/5 px-4 py-3 text-[15px] leading-relaxed"
                  >
                    “{q.text}”
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
