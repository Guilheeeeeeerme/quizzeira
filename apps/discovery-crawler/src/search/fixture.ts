/** Fixture search provider for tests. */

import type { SearchHit, SearchProvider } from "./provider.js";

export function fixtureSearchProvider(): SearchProvider {
  return {
    async search(query, opts) {
      const hits: SearchHit[] = [
        {
          url: "https://planalto.gov.br/ccivil_03/constituicao/constituicao.htm",
          title: `Constituição — ${query}`,
          provider: "fixture",
          rank: 1,
          query,
        },
        {
          url: "https://example.edu.br/gramatica/concordancia-verbal",
          title: `Concordância verbal — ${query}`,
          provider: "fixture",
          rank: 2,
          query,
        },
      ];
      return hits.slice(0, opts.limit);
    },
  };
}
