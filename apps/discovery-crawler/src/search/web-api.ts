import { domainFromUrl } from "@quizzeira/shared";
import { isAllowlistedDomain } from "./allowlist.js";
import type { SearchCandidate, SearchProvider } from "./provider.js";

/**
 * Web search provider (§17.4). Uses SEARCH_API_URL when set:
 *   GET {SEARCH_API_URL}?q=...&limit=...
 * Expected JSON: { results: [{ url, title, snippet? }] }
 * Falls back to empty when unset (allowlist/fixture providers still work).
 */
export class WebApiSearchProvider implements SearchProvider {
  constructor(
    private readonly apiUrl = (process.env.SEARCH_API_URL ?? "").replace(/\/$/, ""),
    private readonly apiKey = process.env.SEARCH_API_KEY ?? "",
  ) {}

  async search(query: string, limit = 10): Promise<SearchCandidate[]> {
    if (!this.apiUrl) return [];
    const url = new URL(this.apiUrl);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const headers: Record<string, string> = {
      accept: "application/json",
      "user-agent": "QuizzeiraDiscoveryCrawler/0.1 (+research; polite)",
    };
    if (this.apiKey) headers.authorization = `Bearer ${this.apiKey}`;

    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) return [];
      const data = (await res.json()) as {
        results?: Array<{ url?: string; title?: string; snippet?: string }>;
      };
      const rows = Array.isArray(data.results) ? data.results : [];
      const out: SearchCandidate[] = [];
      for (let i = 0; i < rows.length && out.length < limit; i += 1) {
        const row = rows[i]!;
        const href = typeof row.url === "string" ? row.url.trim() : "";
        if (!href) continue;
        const domain = domainFromUrl(href);
        // Prefer allowlisted domains; still return others for ranking downstream.
        out.push({
          url: href,
          title: (row.title ?? href).slice(0, 200),
          snippet: row.snippet?.slice(0, 400),
          rank: isAllowlistedDomain(domain ?? "") ? i + 1 : i + 50,
        });
      }
      return out.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    } catch {
      return [];
    }
  }
}
