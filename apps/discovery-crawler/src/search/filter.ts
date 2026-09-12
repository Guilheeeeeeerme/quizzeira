/** Candidate filtering before fetch (§17.3). */

import type { SearchHit } from "./provider.js";

const DENY_HOST =
  /\b(facebook\.com|youtube\.com|tiktok\.com|instagram\.com|twitter\.com|x\.com|linkedin\.com)\b/i;

const DENY_PATH = /\/(login|cadastro|carrinho|checkout|comprar|assinar|plano)(\/|$)/i;

const DENY_TITLE = /simulado\s+gr[aá]tis|baixe\s+agora|curso\s+completo|promo[cç][aã]o/i;

export function filterSearchHit(hit: SearchHit): boolean {
  let parsed: URL;
  try {
    parsed = new URL(hit.url);
  } catch {
    return false;
  }
  if (DENY_HOST.test(parsed.hostname)) return false;
  if (DENY_PATH.test(parsed.pathname)) return false;
  if (DENY_TITLE.test(hit.title)) return false;
  const params = [...parsed.searchParams.keys()];
  if (params.length >= 3) return false;
  if (params.some((p) => /utm_|gclid|fbclid/i.test(p))) return false;
  return true;
}
