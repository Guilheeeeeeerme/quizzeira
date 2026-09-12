// Concept: Allowlist-only search — iterate educational_site sources (§17.4a).
import type { SearchHit, SearchProvider } from "./provider.js";

/** Domains seeded by admin as educational / legislation allowlist. */
const DEFAULT_ALLOWLIST = [
  "planalto.gov.br",
  "www.planalto.gov.br",
  "lexml.gov.br",
  "www.gov.br",
  "educacao.gov.br",
];

export function allowlistProvider(extraSites: string[] = []): SearchProvider {
  const sites = [...new Set([...DEFAULT_ALLOWLIST, ...extraSites])];
  return {
    name: "allowlist-only",
    async search(query, opts) {
      const terms = query
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{M}/gu, "")
        .split(/\s+/)
        .filter((t) => t.length > 2)
        .slice(0, 6);
      const allow = opts.siteAllow?.length ? opts.siteAllow : sites;
      const hits: SearchHit[] = [];
      let rank = 0;
      for (const site of allow) {
        // Construct site-scoped candidate URLs; real fetch happens downstream.
        const pathHint = terms.join("-").slice(0, 80) || "conteudo";
        hits.push({
          url: `https://${site.replace(/^www\./, "")}/?q=${encodeURIComponent(query)}`,
          title: `${query} — ${site}`,
          snippet: pathHint,
          rank: ++rank,
          provider: "allowlist-only",
        });
        if (hits.length >= opts.limit) break;
      }
      return hits;
    },
  };
}
