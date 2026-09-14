// Concept: Topic-query candidate pre-fetch filters (§17.3).

import { domainFromUrl } from "@quizzeira/shared";
import type { SearchCandidate } from "./provider.js";
import { isAllowlistedDomain } from "./allowlist.js";

/** Domains that must never feed knowledge discovery. */
export const KNOWLEDGE_DENYLIST = new Set([
  // social / video / chat
  "facebook.com", "instagram.com", "twitter.com", "x.com", "tiktok.com", "youtube.com", "youtu.be",
  "linkedin.com", "pinterest.com", "reddit.com", "telegram.me", "t.me", "whatsapp.com", "discord.com",
  "vimeo.com", "twitch.tv", "spotify.com", "quora.com", "medium.com",
  // marketplaces / course funnels
  "hotmart.com", "kiwify.com.br", "eduzz.com", "amazon.com.br", "amazon.com", "mercadolivre.com.br",
  "shopee.com.br", "aliexpress.com", "olx.com.br", "udemy.com", "apple.com", "google.com", "bing.com",
  // document mirrors / paywalled uploads (render nothing useful server-side)
  "scribd.com", "passeidireto.com", "docsity.com", "brainly.com.br", "yumpu.com", "issuu.com",
  "slideshare.net", "studocu.com", "academia.edu", "researchgate.net", "4shared.com", "mega.nz",
  "drive.google.com", "docs.google.com", "dropbox.com", "onedrive.live.com", "wattpad.com",
  // question banks behind login, listing aggregators, jurisprudence dumps
  "qconcursos.com", "tecconcursos.com.br", "pciconcursos.com.br", "concursosnobrasil.com.br",
  "jusbrasil.com.br",
  // news (ephemeral content the judge rejects anyway)
  "g1.globo.com", "globo.com", "folha.uol.com.br", "uol.com.br", "estadao.com.br", "terra.com.br",
  "r7.com", "cnnbrasil.com.br", "metropoles.com", "correiobraziliense.com.br", "gazetadopovo.com.br",
  "veja.abril.com.br", "band.uol.com.br", "sbt.com.br",
]);

/** Foreign registries never host Portuguese study material worth an LLM pass. */
const TLD_DENY = /\.(cn|ru|mo|hk|jp|kr|tw|vn|th|ir|tr|pl|cz|ua|by|kz)$/i;

/** Non-document binaries and media are never knowledge. */
const FILE_DENY =
  /\.(zip|rar|7z|tar|gz|mp3|mp4|avi|mov|wmv|mkv|jpe?g|png|gif|svg|webp|pptx?|xlsx?|csv|exe|apk|dmg)(\?|#|$)/i;

/** Portal sections that are never a study article: funnels, news, listings, forums, paginated indexes. */
const PATH_DENY =
  /\/(login|cadastro|carrinho|checkout|comprar|assinar|plano|premium|paywall|jurisprudencia|diario-?oficial|noticias?|news|tag|tags|categoria|category|author|autor|search|busca|feed|wp-json|comentarios|forum|questoes|simulados?|cursos?|videos?)(\/|$)/i;
const PAGINATION_DENY = /\/page\/\d+|[?&](page|pagina)=\d+/i;
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
const TITLE_SPAM =
  /simulado\s+gr[aá]tis|baixe\s+agora|curso\s+completo|promo[cç][aã]o|gabarito\s+extraoficial|resultado\s+(?:final|preliminar)|convoca[cç][aã]o|inscri[cç][oõ]es\s+abertas|edital\s+publicado/i;

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

  if (TLD_DENY.test(domain)) return "denylist_tld";
  if (FILE_DENY.test(parsed.pathname)) return "deny_file_type";
  if (PATH_DENY.test(parsed.pathname)) return "deny_path";
  if (PAGINATION_DENY.test(c.url)) return "deny_pagination";

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
