// Concept: Candidate URL filters for topic discovery (§17.3).
const DENY_DOMAINS = new Set([
  "facebook.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "linkedin.com",
  "pinterest.com",
  "mercadolivre.com.br",
  "shopee.com.br",
]);

const PATH_DENY_RE = /\/(login|cadastro|carrinho|checkout|comprar|assinar|plano)(\/|$)/i;
const TITLE_DENY_RE = /simulado\s+gr[aá]tis|baixe\s+agora|curso\s+completo|promo[cç][aã]o/i;

export function shouldRejectBeforeFetch(input: {
  url: string;
  title?: string;
  minAuthority?: number;
  authority?: number;
}): string | null {
  let host: string;
  let parsed: URL;
  try {
    parsed = new URL(input.url);
    host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "invalid_url";
  }
  if (DENY_DOMAINS.has(host) || [...DENY_DOMAINS].some((d) => host.endsWith(`.${d}`))) {
    return "domain_denylist";
  }
  if (PATH_DENY_RE.test(parsed.pathname)) return "path_denylist";
  if ([...parsed.searchParams.keys()].length >= 3) return "tracking_params";
  if ([...parsed.searchParams.keys()].some((k) => /utm_|fbclid|gclid/i.test(k))) {
    return "tracking_params";
  }
  if (input.title && TITLE_DENY_RE.test(input.title)) return "title_denylist";
  if (
    input.minAuthority != null &&
    input.authority != null &&
    input.authority < input.minAuthority
  ) {
    return "low_authority";
  }
  return null;
}

export { DENY_DOMAINS };
