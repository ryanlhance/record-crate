"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
// Server/first paint assumes motion is allowed, so SSR markup matches.
const getServerSnapshot = () => false;

/**
 * True when the user has asked the OS to minimize motion. Every entrance/riffle
 * animation in the app degrades to a plain fade or cut when this is set.
 * Uses useSyncExternalStore so it stays in sync with no setState-in-effect.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
