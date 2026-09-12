/**
 * Concurso detail-page parse (§11.2): edition, org, positions, document links.
 * Listing pages are never treated as study artifacts.
 */

import {
  extractEditionKey,
  extractKnownBanca,
  extractKnownOrg,
  inferKindHint,
  kindHintToRoleHint,
  type ArtifactKindHint,
  type RoleHint,
} from "@quizzeira/shared";

export interface DetailDocumentLink {
  url: string;
  label: string;
  kindHint: ArtifactKindHint;
  roleHint: RoleHint;
}

export interface DetailPageParse {
  title: string | null;
  org: string | null;
  banca: string | null;
  editionKey: string | null;
  positions: string[];
  registrationEnd: string | null;
  documents: DetailDocumentLink[];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

const DOC_LABEL_RE =
  /\b(edital|retifica|programa|conte[uú]do\s+program|prova|caderno|gabarito|padr[aã]o\s+de\s+resposta|apostila|anexo)\b/i;

export function parseDetailHtml(html: string, baseUrl: string): DetailPageParse {
  const titleMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripTags(titleMatch[1]) : null;
  const text = stripTags(html).slice(0, 20000);

  const org = extractKnownOrg(title ?? "") || extractKnownOrg(text);
  const banca = extractKnownBanca(title ?? "") || extractKnownBanca(text);
  const editionKey = extractEditionKey(title ?? text, baseUrl);

  const positions: string[] = [];
  for (const m of text.matchAll(/cargo\s*[:\-–]?\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^.\n]{5,80})/gi)) {
    const p = m[1].trim();
    if (p && !positions.includes(p)) positions.push(p);
  }

  let registrationEnd: string | null = null;
  const endMatch = text.match(
    /inscri[cç][oõ]es?.{0,40}?(?:at[eé]|encerra).{0,20}?(\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4})/i,
  );
  if (endMatch) registrationEnd = endMatch[1];

  const documents: DetailDocumentLink[] = [];
  const seen = new Set<string>();
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(hrefRe)) {
    const rawHref = decodeHtmlEntities(match[1]?.trim() ?? "");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    let url: string;
    try {
      url = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    const label = stripTags(match[2]);
    if (!label || label.length < 3) continue;
    if (!DOC_LABEL_RE.test(label) && !DOC_LABEL_RE.test(url) && !/\.pdf(\?|#|$)/i.test(url)) {
      continue;
    }
    if (seen.has(url)) continue;
    seen.add(url);
    const kindHint = inferKindHint(url, label);
    // Never treat the detail page itself as a document candidate.
    if (url.replace(/#.*$/, "") === baseUrl.replace(/#.*$/, "") && kindHint === "listing") {
      continue;
    }
    documents.push({
      url,
      label,
      kindHint,
      roleHint: kindHintToRoleHint(kindHint),
    });
  }

  return { title, org, banca, editionKey, positions, registrationEnd, documents };
}
