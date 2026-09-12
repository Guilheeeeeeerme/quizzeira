import type { ArtifactKindHint, ExamKind, RoleHint } from "@quizzeira/shared";
import {
  buildEditionSlug,
  classifyDocumentHints,
  extractEditionKey,
  extractEmphasisHints,
  extractKnownBanca,
  extractKnownOrg,
  inferExamKind,
  looksLikelyOpen,
  parseRegistrationWindow,
} from "@quizzeira/shared";

export interface DocumentLinkCandidate {
  url: string;
  anchorLabel: string;
  kindHint: ArtifactKindHint;
  roleHint: RoleHint;
}

export interface DetailPageParse {
  title: string;
  org: string | null;
  banca: string | null;
  editionKey: string | null;
  examSlug: string | null;
  detailUrl: string;
  registrationEnd: Date | null;
  status: "open" | "unknown";
  statusSource: "date" | "regex" | null;
  kind: ExamKind;
  positions: string[];
  emphasis: string[];
  documentLinks: DocumentLinkCandidate[];
  editalUrl: string | null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function textOf(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function titleFromHtml(html: string, fallback: string): string {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1?.[1]) {
    const t = textOf(h1[1]);
    if (t.length >= 8) return t;
  }
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleTag?.[1]) {
    const t = textOf(titleTag[1]);
    if (t.length >= 8) return t;
  }
  return fallback;
}

const POSITION_RE =
  /\b(?:cargo(?:s)?|vaga(?:s)?)\s*(?:de|:)?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][\w\s\-/]{3,60})/gi;

function extractPositions(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(POSITION_RE)) {
    const pos = m[1]?.replace(/\s+/g, " ").trim();
    if (pos && pos.length >= 4) found.add(pos);
  }
  return [...found].slice(0, 12);
}

const DOC_SKIP_RE =
  /inscri[cç][ãa]o\s+online|boleto|cart[ãa]o\s+de\s+confirma[çc][ãa]o|perguntas\s+frequentes|facebook|instagram|twitter|linkedin|whatsapp|voltar\s+para/i;

function editalNumberEditionKey(text: string): string | null {
  const m = text.match(/\bedital\s+(?:de\s+abertura\s+)?n[ºo°.]?\s*(\d[\d./-]*)/i);
  return m?.[1] ? m[1].replace(/\s+/g, "") : null;
}

/** Parse a concurso detail page for identity, status, and document links (§11.2). */
export function parseDetailHtml(
  html: string,
  detailUrl: string,
  listingTitle: string,
): DetailPageParse {
  const pageText = textOf(html);
  const title = titleFromHtml(html, listingTitle);
  const org = extractKnownOrg(pageText) || extractKnownOrg(title);
  const banca = extractKnownBanca(pageText) || extractKnownBanca(title);
  const editionKey =
    editalNumberEditionKey(pageText) || extractEditionKey(title, detailUrl);
  const examSlug = editionKey ? buildEditionSlug(org, editionKey, "") || null : null;
  const kind = inferExamKind(title, pageText);
  const regWindow = parseRegistrationWindow(pageText);
  const positions = extractPositions(pageText);
  const emphasis = extractEmphasisHints(`${title} ${pageText}`);

  let status: "open" | "unknown" = "unknown";
  let statusSource: "date" | "regex" | null = null;
  if (regWindow) {
    const today = new Date().toISOString().slice(0, 10);
    status = today >= regWindow.start && today <= regWindow.end ? "open" : "unknown";
    statusSource = "date";
  } else if (looksLikelyOpen(pageText) || looksLikelyOpen(title)) {
    status = "open";
    statusSource = "regex";
  }

  const documentLinks = extractDocumentLinks(html, detailUrl);
  const edital =
    documentLinks.find((d) => d.kindHint === "edital" || d.kindHint === "retificacao")?.url ??
    documentLinks.find((d) => /edital/i.test(d.url))?.url ??
    null;

  return {
    title,
    org,
    banca,
    editionKey,
    examSlug: examSlug || null,
    detailUrl,
    registrationEnd: regWindow?.end ? new Date(`${regWindow.end}T23:59:59.000Z`) : null,
    status,
    statusSource,
    kind,
    positions,
    emphasis,
    documentLinks,
    editalUrl: edital,
  };
}

export function extractDocumentLinks(html: string, baseUrl: string): DocumentLinkCandidate[] {
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const out: DocumentLinkCandidate[] = [];
  const seen = new Set<string>();

  for (const match of html.matchAll(hrefRe)) {
    const rawHref = decodeHtmlEntities(match[1]?.trim() ?? "");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    let url: string;
    try {
      url = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    const anchorLabel = textOf(match[2]);
    if (!anchorLabel || anchorLabel.length < 3) continue;
    if (DOC_SKIP_RE.test(anchorLabel) || DOC_SKIP_RE.test(url)) continue;
    const isDoc =
      /\.pdf(\?|#|$)/i.test(url) ||
      /\bedital\b|\bprova\b|\bgabarito\b|\bretifica|\bprograma\b/i.test(anchorLabel);
    if (!isDoc) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    const hints = classifyDocumentHints(anchorLabel, url);
    out.push({ url, anchorLabel, ...hints });
  }

  return out;
}

/** When the listing row is itself a PDF edital, synthesize a minimal detail parse. */
export function detailFromPdfListing(
  title: string,
  pdfUrl: string,
  listingTitle: string,
): DetailPageParse {
  const hints = classifyDocumentHints(title, pdfUrl);
  return {
    title: listingTitle,
    org: extractKnownOrg(listingTitle),
    banca: extractKnownBanca(listingTitle),
    editionKey: extractEditionKey(listingTitle, pdfUrl),
    examSlug: null,
    detailUrl: pdfUrl,
    registrationEnd: null,
    status: looksLikelyOpen(listingTitle) ? "open" : "unknown",
    statusSource: looksLikelyOpen(listingTitle) ? "regex" : null,
    kind: inferExamKind(listingTitle),
    positions: [],
    emphasis: extractEmphasisHints(listingTitle),
    documentLinks: [{ url: pdfUrl, anchorLabel: title, ...hints }],
    editalUrl: pdfUrl,
  };
}
