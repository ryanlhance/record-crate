import recordsData from "@/data/records.json";

export type CollectionType = "main" | "special" | "compilation";

export interface Album {
  id: string;
  artist: string;
  title: string;
  collection: CollectionType;
  genres: string[];
  vibes: string[];
  year?: number | null;
  cover: string;
  /** For Special Editions: a short note on what makes this pressing special. */
  edition?: string;
}

/** Fixed display order for the three collections. */
export const COLLECTIONS: { type: CollectionType; label: string }[] = [
  { type: "main", label: "Main" },
  { type: "special", label: "Special Editions" },
  { type: "compilation", label: "Compilations" },
];

export const COLLECTION_LABELS: Record<CollectionType, string> = {
  main: "Main",
  special: "Special Editions",
  compilation: "Compilations",
};

export function isCollectionType(value: string): value is CollectionType {
  return value === "main" || value === "special" || value === "compilation";
}

const albums = recordsData as Album[];

/**
 * Tiny stable string hash. Used wherever we need a deterministic-but-varied
 * value from a name/id (Sharpie ink/tilt per genre, Similar-vibes tie-break)
 * so output is identical across builds and renders.
 */
export function hashString(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

/**
 * Sort by artist first name — i.e. the artist string exactly as written, so
 * "John Coltrane" sorts under J and "Khruangbin" under K. Ties break on title.
 */
export function sortByArtistFirstName(list: Album[]): Album[] {
  return [...list].sort((a, b) => {
    const byArtist = a.artist.localeCompare(b.artist, undefined, {
      sensitivity: "base",
    });
    if (byArtist !== 0) return byArtist;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export function getAllAlbums(): Album[] {
  return sortByArtistFirstName(albums);
}

export function getByCollection(type: CollectionType): Album[] {
  return sortByArtistFirstName(albums.filter((a) => a.collection === type));
}

export function getGenres(): string[] {
  const set = new Set<string>();
  albums.forEach((a) => a.genres.forEach((g) => set.add(g)));
  return [...set].sort((a, b) => a.localeCompare(b));
}

/** Match a genre tag (case-insensitive exact match). */
export function getByGenre(genre: string): Album[] {
  const lower = genre.toLowerCase();
  return sortByArtistFirstName(
    albums.filter((a) => a.genres.some((g) => g.toLowerCase() === lower))
  );
}

export function slugifyArtist(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Artists with how many records each has, sorted by name. */
export function getArtists(): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>();
  albums.forEach((a) => counts.set(a.artist, (counts.get(a.artist) ?? 0) + 1));
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugifyArtist(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getByArtistSlug(slug: string): Album[] {
  return sortByArtistFirstName(
    albums.filter((a) => slugifyArtist(a.artist) === slug)
  );
}

/** True when this artist has more than one record in the collection. */
export function artistHasMultiple(name: string): boolean {
  return albums.filter((a) => a.artist === name).length > 1;
}

export function getYears(): number[] {
  const set = new Set<number>();
  albums.forEach((a) => {
    if (a.year) set.add(a.year);
  });
  return [...set].sort((a, b) => b - a);
}

export function getByYear(year: number): Album[] {
  return sortByArtistFirstName(albums.filter((a) => a.year === year));
}

/**
 * One uniformly-random album from `list`, optionally excluding an id so
 * "Shuffle again" never lands on the same record twice in a row. Returns null
 * for an empty list (or a list whose only member is excluded).
 * NON-deterministic by design — call it client-side (event handler / effect).
 */
export function getRandom(list: Album[], excludeId?: string): Album | null {
  const pool = excludeId ? list.filter((a) => a.id !== excludeId) : list;
  if (pool.length === 0) {
    // Excluding the only option — fall back to it rather than returning null.
    return list.length === 1 ? list[0] : null;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * `n` distinct uniformly-random albums (the Spotlight draw). Same randomness
 * caveat as getRandom — pick client-side after mount to avoid hydration
 * mismatch on the static export.
 */
export function getRandomSet(list: Album[], n: number): Album[] {
  const pool = [...list];
  // Partial Fisher–Yates: shuffle just the first min(n, len) slots.
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
