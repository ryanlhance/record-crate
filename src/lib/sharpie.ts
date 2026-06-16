import { hashString } from "./records";

// Sharpie ink palette — scoped to genre labels only (see globals.css for the
// matching CSS vars). Assigned deterministically per genre name so the wall
// looks hand-labeled over time and stays stable across builds.
export const INKS = [
  "#d83a2f", // marker red
  "#2f6bd8", // marker blue
  "#2f9e57", // marker green
  "#e07b27", // marker orange
  "#7a4fc0", // marker purple
  "#2b2723", // marker black
] as const;

/** The genre's ink color. */
export const inkFor = (genre: string) => INKS[hashString(genre) % INKS.length];

/** A stable -3°…+3° tilt so tabs look pinned up by hand, not aligned. */
export const tiltFor = (genre: string) => (hashString(genre + "x") % 7) - 3;

/** Sparse doodle — roughly one label in three. */
export const doodleFor = (genre: string) => hashString(genre + "d") % 3 === 0;

/** Which doodle to draw, alternating star/disc deterministically. */
export const doodleKindFor = (genre: string): "star" | "disc" =>
  hashString(genre + "k") % 2 === 0 ? "star" : "disc";
