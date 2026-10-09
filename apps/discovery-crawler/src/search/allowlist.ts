/** Seed domains for topic-query knowledge discovery (§17.4 / §17.6). */
export const KNOWLEDGE_ALLOWLIST = new Set([
  // Federal legislation & gazettes
  "planalto.gov.br",
  "www.planalto.gov.br",
  "lexml.gov.br",
  "www.lexml.gov.br",
  "in.gov.br",
  "www.in.gov.br",
  "senado.leg.br",
  "www.senado.leg.br",
  "camara.leg.br",
  "www.camara.leg.br",
  // Courts / standards (official knowledge; not commercial jurisprudence dumps)
  "stf.jus.br",
  "www.stf.jus.br",
  "stj.jus.br",
  "www.stj.jus.br",
  "atos.cnj.jus.br",
  "www.cnj.jus.br",
  "cnj.jus.br",
  // Education / exams (gov.br educational materials + residency)
  "portal.mec.gov.br",
  "www.gov.br",
  "gov.br",
  "inep.gov.br",
  "www.inep.gov.br",
]);

export function isAllowlistedDomain(domain: string): boolean {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  for (const entry of KNOWLEDGE_ALLOWLIST) {
    const e = entry.replace(/^www\./, "").toLowerCase();
    if (normalized === e || normalized.endsWith(`.${e}`)) return true;
  }
  return false;
}
