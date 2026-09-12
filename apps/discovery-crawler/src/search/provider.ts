/** Search provider abstraction (§17.4). */

import { allowlistSearchProvider } from "./allowlist-provider.js";
import { fixtureSearchProvider } from "./fixture.js";
import { webApiSearchProvider } from "./web-api.js";

export interface SearchHit {
  url: string;
  title: string;
  snippet?: string;
  provider: string;
  rank: number;
  query: string;
}

export interface SearchProvider {
  search(
    query: string,
    opts: { lang: "pt"; limit: number; siteAllow?: string[] },
  ): Promise<SearchHit[]>;
}

export function createSearchProvider(): SearchProvider {
  const mode = (process.env.SEARCH_PROVIDER ?? "allowlist").toLowerCase();
  if (mode === "fixture") return fixtureSearchProvider();
  if (mode === "web" || mode === "web-search-api") return webApiSearchProvider();
  return allowlistSearchProvider();
}
