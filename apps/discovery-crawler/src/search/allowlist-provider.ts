/** Allowlist-only search: synthesizes site-restricted candidate URLs from query terms. */

import type { SearchHit, SearchProvider } from "./provider.js";
import { EDUCATIONAL_ALLOWLIST } from "./allowlist.js";

export function allowlistSearchProvider(): SearchProvider {
  return {
    async search(query, opts) {
      const q = encodeURIComponent(query);
      const sites = opts.siteAllow?.length ? opts.siteAllow : EDUCATIONAL_ALLOWLIST;
      const hits: SearchHit[] = [];
      let rank = 0;
      for (const site of sites.slice(0, opts.limit)) {
        rank += 1;
        hits.push({
          url: `https://${site.replace(/^https?:\/\//, "")}/?q=${q}`,
          title: `${query} — ${site}`,
          provider: "allowlist",
          rank,
          query,
        });
      }
      return hits.slice(0, opts.limit);
    },
  };
}
