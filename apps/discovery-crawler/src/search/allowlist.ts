/** Seed domains for topic-query knowledge discovery (§17.4). */
export const KNOWLEDGE_ALLOWLIST = new Set([
  "planalto.gov.br",
  "www.planalto.gov.br",
  "www.jusbrasil.com.br",
  "www.stf.jus.br",
  "www.stj.jus.br",
]);

export function isAllowlistedDomain(domain: string): boolean {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  for (const entry of KNOWLEDGE_ALLOWLIST) {
    if (entry.replace(/^www\./, "") === normalized) return true;
  }
  return false;
}
