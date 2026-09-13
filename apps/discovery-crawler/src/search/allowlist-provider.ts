import type { SearchCandidate, SearchProvider } from "./provider.js";
import { KNOWLEDGE_ALLOWLIST } from "./allowlist.js";

/**
 * Allowlist-only provider (§17.4a): no paid search API.
 * Emits site-scoped candidate URLs for educational/legislation domains.
 */
export class AllowlistSearchProvider implements SearchProvider {
  async search(query: string, limit = 10): Promise<SearchCandidate[]> {
    const q = query.trim();
    if (!q) return [];
    const out: SearchCandidate[] = [];
    let rank = 1;
    for (const domain of KNOWLEDGE_ALLOWLIST) {
      const host = domain.replace(/^www\./, "");
      out.push({
        url: `https://${host}/?q=${encodeURIComponent(q)}`,
        title: `${q} — ${host}`,
        snippet: `Allowlist knowledge candidate on ${host}`,
        rank: rank++,
      });
      if (out.length >= limit) break;
    }
    return out;
  }
}
