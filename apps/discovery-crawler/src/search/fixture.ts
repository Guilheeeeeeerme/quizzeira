import type { SearchCandidate, SearchProvider } from "./provider.js";

/** Deterministic search results for tests and fixture mode. */
export class FixtureSearchProvider implements SearchProvider {
  async search(query: string, limit = 10): Promise<SearchCandidate[]> {
    return [
      {
        url: `https://fixture.local/knowledge/${encodeURIComponent(query.slice(0, 40))}`,
        title: `Fixture result for ${query}`,
        snippet: "Stub knowledge page",
        rank: 1,
      },
    ].slice(0, limit);
  }
}
