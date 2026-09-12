// Concept: Fixture search provider for tests (§17.4d).
import type { SearchHit, SearchProvider } from "./provider.js";

const FIXTURE_HITS: SearchHit[] = [
  {
    url: "https://fixture.local/knowledge/concordancia-verbal.html",
    title: "Concordância verbal — resumo concurso",
    snippet: "Com sujeito composto anteposto ao verbo, o verbo vai para o plural.",
    rank: 1,
    provider: "fixture",
  },
  {
    url: "https://fixture.local/knowledge/licitacoes-lei-14133.html",
    title: "Lei 14.133/2021 — modalidades de licitação",
    snippet: "A modalidade pregão é obrigatória para…",
    rank: 2,
    provider: "fixture",
  },
];

export function fixtureSearchProvider(): SearchProvider {
  return {
    name: "fixture",
    async search(query, opts) {
      const q = query.toLowerCase();
      return FIXTURE_HITS.filter(
        (h) =>
          h.title.toLowerCase().includes(q.split(/\s+/)[0] ?? "") ||
          (h.snippet ?? "").toLowerCase().includes(q.split(/\s+/)[0] ?? ""),
      ).slice(0, opts.limit);
    },
  };
}
