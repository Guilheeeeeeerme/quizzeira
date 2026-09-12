/** Optional web search API provider (Brave/SerpAPI via env). */

import type { SearchHit, SearchProvider } from "./provider.js";

export function webApiSearchProvider(): SearchProvider {
  return {
    async search(query, opts) {
      const key = process.env.BRAVE_SEARCH_API_KEY || process.env.SERPAPI_KEY;
      if (!key) return [];

      // Brave Search API when key present.
      if (process.env.BRAVE_SEARCH_API_KEY) {
        try {
          const url = new URL("https://api.search.brave.com/res/v1/web/search");
          url.searchParams.set("q", query);
          url.searchParams.set("count", String(opts.limit));
          const res = await fetch(url, {
            headers: {
              Accept: "application/json",
              "X-Subscription-Token": key,
            },
            signal: AbortSignal.timeout(15000),
          });
          if (!res.ok) return [];
          const data = (await res.json()) as {
            web?: { results?: Array<{ url: string; title: string; description?: string }> };
          };
          return (data.web?.results ?? []).map((r, i) => ({
            url: r.url,
            title: r.title,
            snippet: r.description,
            provider: "brave",
            rank: i + 1,
            query,
          })) satisfies SearchHit[];
        } catch {
          return [];
        }
      }
      return [];
    },
  };
}
