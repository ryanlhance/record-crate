"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause } from "./icons";

/**
 * The "taste test" — a play/pause button overlaid on the album cover that
 * streams the record's 30-second Apple preview clip. A ring around the button
 * fills as the clip plays. The element is keyed by album id at the call site, so
 * swapping albums (or closing the sheet) unmounts it and the cleanup stops audio
 * — only ever one clip playing.
 */
export default function PreviewButton({
  url,
  track,
}: {
  url: string;
  track: string;
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

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
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
      className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/55 text-accent shadow-lg backdrop-blur-sm transition hover:bg-black/65 active:scale-95"
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
        <Pause className="h-6 w-6" />
      ) : (
        <Play className={`h-6 w-6 translate-x-[1px] ${loading ? "opacity-60" : ""}`} />
      )}
    </button>
  );
}
