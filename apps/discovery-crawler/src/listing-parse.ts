import type { CrawlerSource } from "@quizzeira/shared";
import { normalizeOpenExam } from "@quizzeira/shared";

export interface DiscoveredListing {
  title: string;
  href: string;
  textBlob: string;
}

function matchesAny(value: string, patterns: string[]): boolean {
  return patterns.some((p) => {
    try {
      return new RegExp(p, "i").test(value);
    } catch {
      return value.toLowerCase().includes(p.toLowerCase());
    }
  });
}

/** Pure HTML listing parse — used by Playwright path and unit tests. */
export function parseListingHtml(
  html: string,
  baseUrl: string,
  source: Pick<CrawlerSource, "linkPatterns" | "openPatterns">,
): DiscoveredListing[] {
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const out: DiscoveredListing[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(hrefRe)) {
    const rawHref = match[1]?.trim();
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    let href: string;
    try {
      href = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    const title = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!title || title.length < 8) continue;
    const blob = `${title} ${href}`;
    if (!matchesAny(blob, source.linkPatterns)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ title, href, textBlob: blob });
  }

  return out;
}

export function filterOpenListings(
  listings: DiscoveredListing[],
  openPatterns: string[],
): DiscoveredListing[] {
  const open = listings.filter((l) => matchesAny(l.textBlob, openPatterns));
  return open.length > 0 ? open : listings.slice(0, 5);
}

export function listingsToOpenRecords(
  listings: DiscoveredListing[],
  source: CrawlerSource,
) {
  return listings.map((l) =>
    normalizeOpenExam({
      title: l.title,
      href: l.href,
      sourceId: source.id,
      sourceDomain: source.domain,
    }),
  );
}
