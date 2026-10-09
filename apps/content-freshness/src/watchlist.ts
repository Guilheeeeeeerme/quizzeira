import watchlistJson from "./catalog/legislation-watchlist.json";

export interface WatchEntry {
  id: string;
  title: string;
  url: string;
  topicTags: string[];
}

export interface LegislationWatchlist {
  version: number;
  note: string;
  entries: WatchEntry[];
}

export const legislationWatchlist = watchlistJson as LegislationWatchlist;

export function selectWatchBatch(cursor: number, limit: number): {
  items: WatchEntry[];
  nextCursor: number;
} {
  const entries = legislationWatchlist.entries;
  if (entries.length === 0) return { items: [], nextCursor: 0 };
  const start = cursor % entries.length;
  const items: WatchEntry[] = [];
  for (let i = 0; i < Math.min(limit, entries.length); i += 1) {
    items.push(entries[(start + i) % entries.length]!);
  }
  return { items, nextCursor: (start + items.length) % entries.length };
}

export function fingerprintFromHeaders(headers: {
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
}): string {
  return [
    headers.etag?.trim() || "",
    headers.lastModified?.trim() || "",
    headers.contentLength?.trim() || "",
  ].join("|");
}
