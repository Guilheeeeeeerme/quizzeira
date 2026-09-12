// Concept: Search provider abstraction (§17.4).
export interface SearchHit {
  url: string;
  title: string;
  snippet?: string;
  rank: number;
  provider: string;
}

export interface SearchProvider {
  name: string;
  search(
    query: string,
    opts: { lang: "pt"; limit: number; siteAllow?: string[] },
  ): Promise<SearchHit[]>;
}

export { allowlistProvider } from "./allowlist-provider.js";
export { fixtureSearchProvider } from "./fixture.js";
export { webApiSearchProvider } from "./web-api.js";
