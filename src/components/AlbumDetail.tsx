"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Album,
  COLLECTION_LABELS,
  artistHasMultiple,
  slugifyArtist,
} from "@/lib/records";
import { assetPath } from "@/lib/asset";
import { Close } from "./icons";

export default function AlbumDetail({
  album,
  onClose,
}: {
  album: Album;
  onClose: () => void;
}) {
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
        {/* Grab handle — stays pinned at the top so you can always drag down to
            dismiss. A close button sits alongside for anyone who won't discover
            the drag. */}
        <div
          className="sticky top-0 z-10 -mx-6 -mt-2 mb-3 flex cursor-grab touch-none justify-center bg-card py-3 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="h-1.5 w-12 rounded-full bg-white/25" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-4 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-foreground transition active:scale-90"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={assetPath(album.cover)}
          alt={`${album.title} by ${album.artist}`}
          className="mx-auto aspect-square w-56 rounded-xl object-cover shadow-xl"
        />

        <div className="mt-5 text-center">
          <h2 className="font-display text-2xl font-semibold leading-tight">
            {album.title}
          </h2>
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

        {album.edition && (
          <p className="mx-auto mt-3 max-w-xs text-center text-sm italic leading-relaxed text-muted">
            {album.edition}
          </p>
        )}

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
      </div>
    </div>
  );
}
