/** Allowlist educational domains for topic discovery (§17.4 / §17.6). */

export const EDUCATIONAL_ALLOWLIST = [
  "planalto.gov.br",
  "lexml.gov.br",
  "www.gov.br",
  "portal.mec.gov.br",
  "www12.senado.leg.br",
  "www.camara.leg.br",
];

export function isAllowlistedDomain(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return EDUCATIONAL_ALLOWLIST.some(
      (d) => host === d.replace(/^www\./, "") || host.endsWith(`.${d.replace(/^www\./, "")}`),
    );
  } catch {
    return false;
  }
}
