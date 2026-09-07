"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "./icons";

// Only one clip is ever audible. Now that a play button sits on every cover in
// a grid, "unmount stops the audio" isn't enough on its own — nothing unmounts
// when you tap a second cover's button. Whoever starts playing pauses whoever
// was playing; the loser's own `pause` listener flips its button back, so no
// cross-component state is needed.
let nowPlaying: HTMLAudioElement | null = null;

function claimPlayback(audio: HTMLAudioElement) {
  if (nowPlaying && nowPlaying !== audio) nowPlaying.pause();
  nowPlaying = audio;
}

type Size = "sm" | "md" | "lg";

const BOX: Record<Size, string> = {
  sm: "h-11 w-11", // on a grid cover
  md: "h-14 w-14", // on a cover-flow slide
  lg: "h-16 w-16", // on the detail sheet / shuffle reveal
};

// Tucked into the top-right corner rather than sat in the middle of the sleeve.
// Centred, it hides the part of the artwork you most want to look at, and on a
// grid it lands exactly where you'd tap to open the record.
const POS: Record<Size, string> = {
  sm: "right-1.5 top-1.5",
  md: "right-2.5 top-2.5",
  lg: "right-3 top-3",
};

const ICON: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

/**
 * The "taste test" — a play/pause button overlaid on the album cover that
 * streams the record's 30-second Apple preview clip. A ring around the button
 * fills as the clip plays. The element is keyed by album id at the call site, so
 * swapping albums (or closing the sheet) unmounts it and the cleanup stops audio.
 */
export default function PreviewButton({
  url,
  track,
  size = "lg",
}: {
  url: string;
  track: string;
  size?: Size;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1

  useEffect(() => {
    const audio = new Audio(url);
    audio.preload = "none";
    audioRef.current = audio;

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
      audio.currentTime = 0;
    };
    const onPlay = () => {
      setPlaying(true);
      setLoading(false);
    };
    const onPause = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);

    return () => {
      if (nowPlaying === audio) nowPlaying = null;
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.src = "";
    };
  }, [url]);

  const toggle = (e: React.MouseEvent) => {
    // The cover behind this button opens the record; playing a clip shouldn't.
    e.stopPropagation();
    e.preventDefault();
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      claimPlayback(audio);
      setLoading(true);
      audio.play().catch(() => setLoading(false));
    } else {
      audio.pause();
    }
  };

  // Progress ring geometry (viewBox 64×64, rotated so it fills from 12 o'clock).
  const R = 29;
  const CIRC = 2 * Math.PI * R;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        playing ? `Pause preview of ${track}` : `Play 30-second preview of ${track}`
      }
      // `pointer-events-auto` so this still works inside a pointer-events-none
      // overlay — the overlay has to stay transparent to taps or it swallows
      // the whole cover.
      className={`pointer-events-auto absolute z-10 flex items-center justify-center rounded-full bg-black/55 text-accent shadow-lg backdrop-blur-sm transition hover:bg-black/65 active:scale-95 ${BOX[size]} ${POS[size]}`}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 64 64"
        aria-hidden
      >
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.3"
          strokeWidth="2.5"
        />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      {playing ? (
        <Pause className={ICON[size]} />
      ) : (
        <Play
          className={`${ICON[size]} translate-x-[1px] ${loading ? "opacity-60" : ""}`}
        />
      )}
    </button>
  );
}
