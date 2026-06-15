import quotesData from "@/data/reddit.json";

export interface Quote {
  text: string;
  subreddit?: string;
}

// Curated, frozen-in-time Reddit comments per album id (see scripts/fetch-reddit.mjs
// + curation). Not live — these were scraped and hand-picked once.
const quotes = quotesData as Record<string, Quote[]>;

export function getQuotes(albumId: string): Quote[] {
  return quotes[albumId] ?? [];
}
