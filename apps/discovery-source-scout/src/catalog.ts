import catalogJson from "./catalog/sources.json";

export type CatalogPriority = "P0" | "P1" | "P2";

export interface CatalogSource {
  id: string;
  name: string;
  domain: string;
  startUrls: string[];
  kind: string;
  strategy: string;
  discoveryMode: string;
  priority: CatalogPriority;
  category: string;
  contentTypes: string[];
  topicTags: string[];
  notes?: string;
}

export interface SourceCatalog {
  version: number;
  note: string;
  sources: CatalogSource[];
  doNotScrape: string[];
}

export const sourceCatalog = catalogJson as SourceCatalog;

/** Rotate through the catalog; prefer higher priority first. */
export function selectCatalogBatch(
  cursor: number,
  limit: number,
  priorityFilter?: string,
): { items: CatalogSource[]; nextCursor: number } {
  const ordered = [...sourceCatalog.sources].sort((a, b) => a.priority.localeCompare(b.priority));
  const filtered = priorityFilter
    ? ordered.filter((s) => s.priority === priorityFilter)
    : ordered;
  if (filtered.length === 0) return { items: [], nextCursor: 0 };
  const start = cursor % filtered.length;
  const items: CatalogSource[] = [];
  for (let i = 0; i < Math.min(limit, filtered.length); i += 1) {
    items.push(filtered[(start + i) % filtered.length]!);
  }
  return { items, nextCursor: (start + items.length) % filtered.length };
}

export function isDeniedCatalogDomain(domain: string): boolean {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  return sourceCatalog.doNotScrape.some(
    (d) => normalized === d || normalized.endsWith(`.${d}`),
  );
}
