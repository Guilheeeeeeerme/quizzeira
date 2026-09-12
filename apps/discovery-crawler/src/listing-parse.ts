import type { CrawlerSource } from "@quizzeira/shared";
import { normalizeOpenExam } from "@quizzeira/shared";

export interface DiscoveredListing {
  title: string;
  href: string;
  textBlob: string;
}

function matchesAny(value: string, patterns: string[]): boolean {
  // Empty pattern list = no filter (UI: "Empty keeps everything").
  if (patterns.length === 0) return true;
  return patterns.some((p) => {
    try {
      return new RegExp(p, "i").test(value);
    } catch {
      return value.toLowerCase().includes(p.toLowerCase());
    }
  });
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

const JUNK_URL_RE =
  /privacidade|cmplz|cookiedatabase|\/fundacao|#sobre|#historia|#atividades|#avaliacao|#vestibulares|cookie|vendor_count|colabore-enviando|mais-acessadas|\/social|#florescer|\/cultural|\/educacao|institucional\/conheca|portal\s*do\s*colaborador|arquivo-antigo\/\[object|\/contato$|page_category|\/noticias(?:\/|$|\?)|avaliacao#|concursos\?id=|\/em-andamento\/|ucat=\d+/i;

const JUNK_TITLE_RE =
  /^(inscri[cç][oõ]es?\s+abertas?|saiba\s+mais|clique\s+aqui|leia\s+mais|ver\s+mais|edital|download|pdf|fundação|fundacao|sobre\s+nós|sobre\s+nos|história|historia|publicações|publicacoes|pesquisas|atividades|avalia[cç][aã]o|avalia[cç][aã]o\s+digital|vestibulares|concursos|privacidade(\s*&\s*cookies)?|gerenciar(\s+opções|\s+opcoes|\s+serviços|\s+servicos|\s+\{?vendor_count\}?\s+fornecedores)?|cookies?|carreiras|jovem\s+aprendiz|educação|educacao|faculdade|mestrado\s+e\s+p[oó]s|pesquisa|semin[aá]rios\s+e\s+eventos|centro\s+cultural|cultural|pr[eê]mios\s+e\s+concursos|oficinas|eventos\s+e\s+a[cç][oõ]es|florescer|jornal\s+o\s+progresso|apostando\s+no\s+futuro|quem\s+somos|parceiros|contrate|entre\s+em\s+contato|assine\s+o\s+nosso|em\s+andamento|conclu[ií]dos|not[ií]cias|resultados|certifica[cç][aã]o|pisa\s+para\s+escolas)$/i;


function isJunkListingTitle(title: string): boolean {
  return JUNK_TITLE_RE.test(title.trim());
}

function isJunkListingUrl(href: string): boolean {
  return JUNK_URL_RE.test(href);
}

/** Pure HTML listing parse — used by Playwright path and unit tests. */
export function parseListingHtml(
  html: string,
  baseUrl: string,
  source: Pick<CrawlerSource, "linkPatterns" | "openPatterns">,
): DiscoveredListing[] {
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const out: DiscoveredListing[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(hrefRe)) {
    const rawHref = decodeHtmlEntities(match[1]?.trim() ?? "");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    let href: string;
    try {
      href = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    const title = decodeHtmlEntities(
      match[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim(),
    );
    if (!title || title.length < 8) continue;
    // Nav / CTA / privacy labels are not exam names (e.g. "INSCRIÇÕES ABERTAS").
    if (isJunkListingTitle(title)) continue;
    if (isJunkListingUrl(href)) continue;
    const blob = `${title} ${href}`;
    if (!matchesAny(blob, source.linkPatterns)) continue;
    if (seen.has(href)) continue;
    seen.add(href);
    out.push({ title, href, textBlob: blob });
  }

  return out;
}

/** Prefer real exam detail pages over nav/category chrome when capping a pass. */
function examLikenessScore(listing: DiscoveredListing): number {
  let score = 0;
  if (/\/concurso\//i.test(listing.href)) score += 12;
  if (/\/provas?\//i.test(listing.href)) score += 8;
  if (/\.pdf(\?|#|$)/i.test(listing.href)) score += 6;
  if (/\b20\d{2}\b/.test(listing.title) || /\/[^/]*20\d{2}/i.test(listing.href)) score += 5;
  if (/edital|inscri/i.test(listing.textBlob)) score += 3;
  if (/page_category|noticias|avaliacao#|em-andamento|concluidos|ucat=/i.test(listing.href)) {
    score -= 12;
  }
  return score;
}

export function filterOpenListings(
  listings: DiscoveredListing[],
  openPatterns: string[],
): DiscoveredListing[] {
  if (openPatterns.length > 0) {
    const open = listings.filter((l) => matchesAny(l.textBlob, openPatterns));
    if (open.length > 0) return open;
  }
  // Empty openPatterns: keep everything, but rank exam-like URLs first so the
  // per-source cap (maxOpenPerSource) does not drop Transpetro behind nav chrome.
  return [...listings].sort((a, b) => examLikenessScore(b) - examLikenessScore(a));
}

export function listingsToOpenRecords(
  listings: DiscoveredListing[],
  source: CrawlerSource,
) {
  return listings.map((l) =>
    normalizeOpenExam({
      title: l.title,
      href: l.href,
      sourceId: source.id,
      sourceDomain: source.domain,
    }),
  );
}
