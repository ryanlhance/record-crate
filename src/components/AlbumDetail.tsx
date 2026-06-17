"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  type Album,
  artistHasMultiple,
  slugifyArtist,
  genreSlug,
} from "@/lib/records";
import { assetPath } from "@/lib/asset";
import { Close } from "./icons";
import SimilarVibes from "./SimilarVibes";
import PreviewButton from "./PreviewButton";

export default function AlbumDetail({
  album,
  onClose,
}: {
  album: Album;
  onClose: () => void;
}) {
  // A back-stack of albums viewed within this sheet. Tapping a Similar-vibes
  // neighbor pushes a new album so you can wander album → album → album in
  // place; close/drag/Escape always exit the whole sheet (back to where you
  // opened it). `album` is stable per mount in every call site (selection
  // toggles through null), so we seed the stack once.
  const [stack, setStack] = useState<Album[]>(() => [album]);
  const current = stack[stack.length - 1];

  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);

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

  // On open and on every in-place swap: scroll the sheet back to the top and
  // move focus to the new title (the live region announces it to SRs).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    titleRef.current?.focus();
  }, [current.id]);

  const swapTo = (next: Album) => setStack((s) => [...s, next]);

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

  const artistMultiple = artistHasMultiple(current.artist);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Album details"
    >
      {/* Announces the current album to screen readers on open and on swap. */}
      <p aria-live="polite" className="sr-only">
        {`${current.title} by ${current.artist}.`}
      </p>

      <div
        ref={scrollRef}
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

        {/* Cover, with the "taste test" preview button overlaid when we have a
            clip for this record. Keyed by id so each album gets a fresh audio
            element (and the old one is torn down) on open and on in-place swap. */}
        <div className="relative mx-auto w-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(current.cover)}
            alt=""
            className="aspect-square w-full rounded-xl object-cover shadow-xl"
          />
          {current.preview && (
            <PreviewButton
              key={current.id}
              url={current.preview.url}
              track={current.preview.track}
            />
          )}
        </div>

        <div className="mt-5 text-center">
          <h2
            ref={titleRef}
            tabIndex={-1}
            className="font-display text-2xl font-semibold leading-tight outline-none"
          >
            {current.title}
          </h2>
          {artistMultiple ? (
            <Link
              href={`/artist/${slugifyArtist(current.artist)}`}
              className="mt-1 inline-block text-lg text-accent underline decoration-accent/40 underline-offset-4"
            >
              {current.artist}
            </Link>
          ) : (
            <p className="mt-1 text-lg text-accent">{current.artist}</p>
          )}
        </div>

        {current.edition && (
          <p className="mx-auto mt-3 max-w-xs text-center text-sm italic leading-relaxed text-muted">
            {current.edition}
          </p>
        )}

        {/* Tappable facets: year · genres. (Collection is intentionally omitted —
            the detail itself makes the type clear; the collections live on the
            home screen.) */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {current.year && (
            <Link
              href={`/year/${current.year}`}
              className="rounded-full bg-white/10 px-3 py-1 text-sm transition active:scale-95"
            >
              {current.year}
            </Link>
          )}
          {current.genres.map((g) => (
            <Link
              key={g}
              href={`/browse/${genreSlug(g)}`}
              className="rounded-full border border-accent/50 px-3 py-1 text-sm text-accent transition active:scale-95"
            >
              {g}
            </Link>
          ))}
        </div>

        {/* Similar vibes — the sheet's one discovery moment. Tapping a neighbor
            swaps the album in place. */}
        <SimilarVibes album={current} onSelect={swapTo} />
      </div>
    </div>
  );
}
