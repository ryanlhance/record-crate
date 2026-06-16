"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Album, getRandom, getRandomSet } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { assetPath } from "@/lib/asset";
import AlbumDetail from "./AlbumDetail";
import { Vinyl, Close } from "./icons";

// Shuffle — the serendipity engine. A persistent fixed cardboard "chip" button
// (always one tap away while browsing). Tapping picks a uniformly-random album
// from the CURRENT context (the `albums` passed in), riffles briefly, then lands
// on one cover with "View details" and "Shuffle again". Label is "Shuffle" /
// the icon only — never cute phrasing.
export default function ShuffleControl({ albums }: { albums: Album[] }) {
  const reduced = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Album | null>(null);
  // The riffle "deck": a few covers ending on the final pick. We render them all
  // (preloaded) stacked in a fixed-size slot and cross-fade between them by
  // index, so nothing flickers, flips, or changes size.
  const [frames, setFrames] = useState<Album[]>([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [detail, setDetail] = useState<Album | null>(null);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const revealRef = useRef<HTMLDivElement | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRoll = useRef(0);

  const clearTimer = () => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  };

  // Roll a new pick. `excludeId` keeps "Shuffle again" off the current record.
  const roll = useCallback(
    (excludeId?: string) => {
      // Debounce: at most one roll per ~500ms so rapid taps can't stutter.
      const now = Date.now();
      if (now - lastRoll.current < 500) return;
      lastRoll.current = now;

      const final = getRandom(albums, excludeId);
      if (!final) return;
      clearTimer();

      // Reduced motion, or nothing to riffle through: cut straight to it.
      if (reduced || albums.length < 2) {
        setFrames([final]);
        setFrameIndex(0);
        setChosen(final);
        return;
      }

      // Build the deck: a few random covers that aren't the winner, then the
      // winner last. Advancing the index cross-fades one cover into the next.
      const lead = getRandomSet(
        albums.filter((a) => a.id !== final.id),
        3
      );
      const deck = [...lead, final];
      setChosen(null);
      setFrames(deck);
      setFrameIndex(0);
      let i = 0;
      timer.current = setInterval(() => {
        i += 1;
        setFrameIndex(i);
        if (i >= deck.length - 1) {
          clearTimer();
          setChosen(final);
        }
      }, 140);
    },
    [albums, reduced]
  );

  const openShuffle = () => {
    setDetail(null);
    setOpen(true);
    roll();
  };

  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
    setChosen(null);
    setFrames([]);
    setFrameIndex(0);
    setDetail(null);
    // Return focus to whatever opened the reveal.
    triggerRef.current?.focus();
  }, []);

  // Escape closes; move focus into the reveal when it opens; clean up the timer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    revealRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  useEffect(() => () => clearTimer(), []);

  return (
    <>
      {!open && (
        <button
          ref={triggerRef}
          type="button"
          onClick={openShuffle}
          aria-label="Shuffle"
          className="fixed bottom-0 left-1/2 z-40 mb-[calc(env(safe-area-inset-bottom)+1rem)] h-16 w-16 -translate-x-1/2 transition [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.55))] active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath("/ui/shuffle.png")}
            alt=""
            draggable={false}
            className="h-full w-full select-none object-contain"
          />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 px-6 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Shuffle"
        >
          {/* Result for screen readers, without depending on the animation. */}
          <p aria-live="polite" className="sr-only">
            {chosen ? `${chosen.title} by ${chosen.artist}.` : ""}
          </p>

          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-card text-foreground transition active:scale-90"
          >
            <Close className="h-5 w-5" />
          </button>

          <div
            ref={revealRef}
            tabIndex={-1}
            className="flex w-full max-w-sm flex-col items-center outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cover: the spotlit landing spot. A soft glow + vinyl peek behind
                a fixed-size slot; the deck cross-fades in place so the cover
                never flickers or changes size. */}
            <div
              className={`relative aspect-square w-64 max-w-[72vw] ${
                chosen && !reduced ? "shuffle-land" : ""
              }`}
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-full opacity-60 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(205,162,74,0.32), transparent 70%)",
                }}
                aria-hidden="true"
              />
              <Vinyl
                className="pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-[118%] -translate-x-1/2 -translate-y-1/2 text-foreground/15"
                aria-hidden="true"
              />
              {frames.map((album, idx) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={`${album.id}-${idx}`}
                  src={assetPath(album.cover)}
                  alt={
                    chosen && idx === frames.length - 1
                      ? `${chosen.title} by ${chosen.artist}`
                      : ""
                  }
                  draggable={false}
                  className="absolute inset-0 h-full w-full select-none rounded-xl object-cover shadow-2xl transition-opacity duration-200 ease-out"
                  style={{ opacity: idx === frameIndex ? 1 : 0 }}
                />
              ))}
            </div>

            {/* Title/artist + actions. The block always reserves its height so
                the cover above stays put while riffling (it doesn't drop when
                the text appears); the content just fades in once we've landed. */}
            <div className="mt-6 flex min-h-[180px] w-full flex-col items-center">
              {chosen && (
                <div
                  className={`flex w-full flex-col items-center ${
                    reduced ? "" : "fade-in-up"
                  }`}
                >
                  <p className="text-center font-display text-2xl leading-tight">
                    {chosen.title}
                  </p>
                  <p className="mt-1 text-accent">{chosen.artist}</p>

                  <div className="mt-7 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setDetail(chosen)}
                      className="rounded-full bg-foreground px-6 py-3 font-display text-sm text-background transition active:scale-95"
                    >
                      View details
                    </button>
                    <button
                      type="button"
                      onClick={() => roll(chosen.id)}
                      disabled={albums.length < 2}
                      aria-label="Shuffle again"
                      className="h-14 w-14 transition [filter:drop-shadow(0_3px_6px_rgba(0,0,0,0.55))] active:scale-95 disabled:opacity-40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={assetPath("/ui/shuffle.png")}
                        alt=""
                        draggable={false}
                        className="h-full w-full select-none object-contain"
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detail && (
        <AlbumDetail album={detail} onClose={() => setDetail(null)} />
      )}
    </>
  );
}
