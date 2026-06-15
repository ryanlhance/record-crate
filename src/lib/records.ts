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
