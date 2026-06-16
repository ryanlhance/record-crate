"use client";

import { useEffect, useState } from "react";

/**
 * True when the user has asked the OS to minimize motion. Every entrance/riffle
 * animation in the app degrades to a plain fade or cut when this is set.
 * Starts `false` so SSR/first paint matches, then resolves after mount.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
