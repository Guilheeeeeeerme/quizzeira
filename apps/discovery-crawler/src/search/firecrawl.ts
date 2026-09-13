import { domainFromUrl } from "@quizzeira/shared";
import { isAllowlistedDomain } from "./allowlist.js";
import type { SearchCandidate, SearchProvider } from "./provider.js";

/** Minimal shape of Firecrawl `/v1/search` and `/v2/search` responses. */
export interface FirecrawlSearchResponse {
  success?: boolean;
  data?:
    | Array<{ url?: string; title?: string; description?: string }>
    | { web?: Array<{ url?: string; title?: string; description?: string }> };
  error?: string;
}

/** Normalizes v1 (`data: []`) and v2 (`data.web: []`) payloads into candidates. */
export function parseFirecrawlSearch(
  payload: FirecrawlSearchResponse,
  limit: number,
): SearchCandidate[] {
  const rows = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.data?.web)
      ? payload.data.web
      : [];
  const out: SearchCandidate[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rows.length && out.length < limit; i += 1) {
    const row = rows[i]!;
    const href = typeof row.url === "string" ? row.url.trim() : "";
    if (!href || seen.has(href)) continue;
    seen.add(href);
    const domain = domainFromUrl(href) ?? "";
    out.push({
      url: href,
      title: (row.title ?? href).slice(0, 200),
      snippet: row.description?.slice(0, 400),
      // Allowlisted domains keep their engine rank; others still rank ≤ 20 so
      // the §17.3 pre-fetch filter keeps them for post-fetch scoring.
      rank: isAllowlistedDomain(domain) ? i + 1 : Math.min(i + 11, 20),
    });
  }
  return out;
}

/**
 * Firecrawl web search provider (§17.4c). Server-side HTTP call using the
 * same FIRECRAWL_API_KEY the API service uses for past-exam search.
 */
export class FirecrawlSearchProvider implements SearchProvider {
  constructor(
    private readonly apiKey = process.env.FIRECRAWL_API_KEY ?? "",
    private readonly baseUrl = (process.env.FIRECRAWL_API_URL ?? "https://api.firecrawl.dev")
      .replace(/\/$/, ""),
  ) {}

  async search(query: string, limit = 10): Promise<SearchCandidate[]> {
    const q = query.trim();
    if (!q || !this.apiKey) return [];
    try {
      const res = await fetch(`${this.baseUrl}/v1/search`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
          "user-agent": "QuizzeiraDiscoveryCrawler/0.1 (+research; polite)",
        },
        body: JSON.stringify({ query: q, limit, lang: "pt", country: "br" }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return [];
      const payload = (await res.json()) as FirecrawlSearchResponse;
      return parseFirecrawlSearch(payload, limit);
    } catch {
      return [];
    }
  }
}
