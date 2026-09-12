// Concept: Topic-query candidate pre-fetch filters (§17.3).

import { domainFromUrl } from "@quizzeira/shared";
import type { SearchCandidate } from "./provider.js";
import { isAllowlistedDomain } from "./allowlist.js";

/** Domains that must never feed knowledge discovery. */
export const KNOWLEDGE_DENYLIST = new Set([
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "linkedin.com",
  "pinterest.com",
  "reddit.com",
  "telegram.me",
  "t.me",
  "whatsapp.com",
  "hotmart.com",
  "kiwify.com.br",
  "eduzz.com",
  "amazon.com.br",
  "mercadolivre.com.br",
]);

const PATH_DENY =
  /\/(login|cadastro|carrinho|checkout|comprar|assinar|plano|premium|paywall)(\/|$)/i;
const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "mc_cid",
  "mc_eid",
]);
const TITLE_SPAM = /simulado\s+gr[aá]tis|baixe\s+agora|curso\s+completo|promo[cç][aã]o/i;

export function isDeniedDomain(domain: string): boolean {
  const normalized = domain.replace(/^www\./, "").toLowerCase();
  for (const entry of KNOWLEDGE_DENYLIST) {
    if (normalized === entry || normalized.endsWith(`.${entry}`)) return true;
  }
  return false;
}

export function rejectCandidateBeforeFetch(c: SearchCandidate): string | null {
  const domain = domainFromUrl(c.url);
  if (!domain) return "bad_url";
  if (isDeniedDomain(domain)) return "denylist_domain";

  let parsed: URL;
  try {
    parsed = new URL(c.url);
  } catch {
    return "bad_url";
  }

  if (PATH_DENY.test(parsed.pathname)) return "deny_path";

  const params = [...parsed.searchParams.keys()];
  if (params.length >= 3) return "too_many_params";
  if (params.some((p) => TRACKING_PARAMS.has(p.toLowerCase()))) return "tracking_param";

  if (c.title && TITLE_SPAM.test(c.title)) return "title_spam";

  return null;
}

/** Prefer allowlisted domains; drop denylist/spam before fetch (§17.3). */
export function filterSearchCandidates(
  candidates: SearchCandidate[],
  opts?: { requireAllowlist?: boolean },
): SearchCandidate[] {
  const out: SearchCandidate[] = [];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.url)) continue;
    if (rejectCandidateBeforeFetch(c)) continue;
    const domain = domainFromUrl(c.url);
    if (!domain) continue;
    if (opts?.requireAllowlist && !isAllowlistedDomain(domain)) continue;
    if (!isAllowlistedDomain(domain) && (c.rank ?? 99) > 20) continue;
    seen.add(c.url);
    out.push(c);
  }
  return out;
}
