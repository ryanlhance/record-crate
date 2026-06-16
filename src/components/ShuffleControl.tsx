"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type Album, getRandom, getRandomSet } from "@/lib/records";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { assetPath } from "@/lib/asset";
import AlbumDetail from "./AlbumDetail";
import { Shuffle as ShuffleIcon, Vinyl, Close } from "./icons";

// Shuffle — the serendipity engine. Two surfaces, one action:
//  - `hero`: a square tile beside the home hero.
//  - `pill`: a persistent fixed pill, always one tap away while browsing.
// Tapping picks a uniformly-random album from the CURRENT context (the `albums`
// passed in), riffles briefly, then lands on one cover with "View details" and
// "Shuffle again". Label is "Shuffle" / the icon only — never cute phrasing.
export default function ShuffleControl({
  albums,
  variant = "pill",
}: {
  albums: Album[];
  variant?: "pill" | "hero";
}) {
  const reduced = useReducedMotion();

  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<Album | null>(null);
  const [riffleCover, setRiffleCover] = useState<Album | null>(null);
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
        setRiffleCover(null);
        setChosen(final);
        return;
      }

      // Riffle: flick a few random covers past (~90ms each), then land.
      setChosen(null);
      const frames = getRandomSet(albums, 4);
      let i = 0;
      setRiffleCover(frames[0]);
      timer.current = setInterval(() => {
        i += 1;
        if (i >= frames.length) {
          clearTimer();
          setRiffleCover(null);
          setChosen(final);
        } else {
          setRiffleCover(frames[i]);
        }
      }, 90);
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
    setRiffleCover(null);
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

  const display = riffleCover ?? chosen;

  return (
    <>
      {variant === "hero" ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={openShuffle}
          aria-label="Shuffle"
          className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl bg-card transition active:scale-[0.97]"
        >
          <Vinyl className="h-9 w-9 text-foreground" />
          <span className="font-display text-sm">Shuffle</span>
        </button>
      ) : (
        !open && (
          <button
            ref={triggerRef}
            type="button"
            onClick={openShuffle}
            aria-label="Shuffle"
            className="fixed bottom-0 left-1/2 z-40 mb-[calc(env(safe-area-inset-bottom)+1rem)] flex -translate-x-1/2 items-center gap-2 rounded-full border border-foreground/15 bg-card/90 py-2.5 pl-3 pr-4 shadow-2xl backdrop-blur transition active:scale-95"
          >
            <Vinyl className="h-6 w-6 text-foreground" />
            <span className="font-display text-sm">Shuffle</span>
          </button>
        )
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

          <p className="eyebrow mb-8">Shuffle</p>

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
            {/* Cover: the spotlit landing spot. Vinyl peeks behind + a soft glow. */}
            <div className="relative flex aspect-square w-64 max-w-[72vw] items-center justify-center">
              <div
                className="pointer-events-none absolute inset-0 -z-10 rounded-full opacity-60 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(232,57,43,0.35), transparent 70%)",
                }}
                aria-hidden="true"
              />
              <Vinyl
                className="pointer-events-none absolute -z-10 h-[115%] w-[115%] text-foreground/20"
                aria-hidden="true"
              />
              {display && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={display.id}
                  src={assetPath(display.cover)}
                  alt={chosen ? `${chosen.title} by ${chosen.artist}` : ""}
                  draggable={false}
                  className={`aspect-square w-full select-none rounded-xl object-cover shadow-2xl ${
                    chosen && !reduced ? "shuffle-land" : ""
                  }`}
                />
              )}
            </div>

            {/* Title/artist + actions, shown once we've landed. */}
            {chosen && (
              <div
                className={`mt-6 flex w-full flex-col items-center ${
                  reduced ? "" : "fade-in-up"
                }`}
              >
                <p className="text-center font-display text-2xl leading-tight">
                  {chosen.title}
                </p>
                <p className="mt-1 text-accent">{chosen.artist}</p>

                <div className="mt-7 flex items-center gap-3">
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
                    className="flex items-center gap-2 rounded-full border border-foreground/15 bg-card px-5 py-3 font-display text-sm transition active:scale-95 disabled:opacity-40"
                  >
                    <ShuffleIcon className="h-5 w-5" />
                    Shuffle again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {detail && (
        <AlbumDetail album={detail} onClose={() => setDetail(null)} />
      )}
    </>
  );
}
