// Concept: Optional web-search API provider (§17.4b) — disabled unless keyed.
import type { SearchHit, SearchProvider } from "./provider.js";

export function webApiSearchProvider(): SearchProvider {
  const apiKey = process.env.WEB_SEARCH_API_KEY ?? "";
  const endpoint = process.env.WEB_SEARCH_API_URL ?? "";
  return {
    name: "web-search-api",
    async search(query, opts) {
      if (!apiKey || !endpoint) return [];
      try {
        const url = new URL(endpoint);
        url.searchParams.set("q", query);
        url.searchParams.set("count", String(opts.limit));
        if (opts.siteAllow?.length) {
          url.searchParams.set("sites", opts.siteAllow.join(","));
        }
        const res = await fetch(url, {
          headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
          signal: AbortSignal.timeout(15_000),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { results?: Array<{ url: string; title: string; snippet?: string }> };
        return (data.results ?? []).slice(0, opts.limit).map(
          (r, i): SearchHit => ({
            url: r.url,
            title: r.title,
            snippet: r.snippet,
            rank: i + 1,
            provider: "web-search-api",
          }),
        );
      } catch {
        return [];
      }
    },
  };
}
