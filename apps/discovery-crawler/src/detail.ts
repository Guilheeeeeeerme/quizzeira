// Concept: Concurso detail-page parse (§11.2 items 2–6).
import type { ArtifactKindHint, RoleHint } from "@quizzeira/shared";
import {
  classifyExamKind,
  examSlugFromIdentity,
  extractEditionKey,
  extractKnownOrg,
  extractPositionsFromText,
  isRegistrationOpen,
  kindToHints,
  parseRegistrationWindow,
  slugifyKey,
} from "@quizzeira/shared";

export interface DetailDocumentLink {
  url: string;
  label: string;
  kindHint: ArtifactKindHint;
  roleHint: RoleHint;
}

export interface DetailPageResult {
  title: string;
  org: string | null;
  editionKey: string | null;
  examSlug: string;
  examKind: ReturnType<typeof classifyExamKind>;
  registrationEnd: string | null;
  status: "open" | "unknown";
  statusSource: "date" | "regex" | null;
  positions: string[];
  documents: DetailDocumentLink[];
  /** True when this is a listing/nav page, not a concurso detail. */
  looksLikeListing: boolean;
}

const DOC_LABEL_RULES: Array<{ re: RegExp; kind: ArtifactKindHint }> = [
  { re: /\bretifica/i, kind: "retificacao" },
  { re: /\bedital\b/i, kind: "edital" },
  { re: /\bprograma|conte[úu]do\s+program/i, kind: "programa" },
  { re: /\bgabarito\b/i, kind: "gabarito" },
  { re: /\bcaderno|prova\b/i, kind: "prova" },
  { re: /\bpadr[ãa]o\s+de\s+resposta/i, kind: "padrao_resposta" },
  { re: /\bapostila\b/i, kind: "apostila" },
  { re: /\bmanual\b/i, kind: "manual" },
];

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

function classifyLink(label: string, href: string): DetailDocumentLink | null {
  const blob = `${label} ${href}`;
  for (const rule of DOC_LABEL_RULES) {
    if (rule.re.test(blob)) {
      const hints = kindToHints(rule.kind);
      return { url: href, label, kindHint: hints.kindHint, roleHint: hints.roleHint };
    }
  }
  if (/\.pdf(\?|#|$)/i.test(href)) {
    // Bare PDF with no taxonomy label — prefer edital only when the path hints it.
    if (/edital/i.test(href)) {
      return { url: href, label: label || "edital", kindHint: "edital", roleHint: "specification" };
    }
    return { url: href, label: label || "documento", kindHint: "unknown", roleHint: "unknown" };
  }
  return null;
}

function extractTitle(html: string): string {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1) {
    const t = stripTags(h1[1]);
    if (t.length >= 8) return t;
  }
  const og = /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (og) return decodeHtmlEntities(og[1]).trim();
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (title) return stripTags(title[1]);
  return "Concurso";
}

/**
 * Parse a concurso detail page for edition identity, registration window,
 * positions, and document links with kind/role hints.
 */
export function parseDetailHtml(html: string, pageUrl: string, orgHint?: string | null): DetailPageResult {
  const title = extractTitle(html);
  const text = stripTags(html).slice(0, 50_000);
  const org = orgHint?.trim() || extractKnownOrg(title) || extractKnownOrg(text);
  const editionKey = extractEditionKey(`${title} ${text}`) || extractEditionKey(pageUrl);
  const examKind = classifyExamKind(`${title} ${text}`);
  const window = parseRegistrationWindow(text);
  const positions = extractPositionsFromText(`${title}\n${text}`);

  let status: "open" | "unknown" = "unknown";
  let statusSource: "date" | "regex" | null = null;
  if (window && isRegistrationOpen(window)) {
    status = "open";
    statusSource = "date";
  } else if (/inscri[çc][õo]es?\s+abertas?/i.test(text) || /edital\s+de\s+abertura/i.test(text)) {
    // Regex alone is only "likely open" — keep status unknown unless a date confirms.
    status = "unknown";
    statusSource = "regex";
  }

  const examSlug =
    org && editionKey
      ? examSlugFromIdentity(org, editionKey)
      : slugifyKey(org || title, 60) || slugifyKey(pageUrl, 40);

  const documents: DetailDocumentLink[] = [];
  const seen = new Set<string>();
  const hrefRe = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(hrefRe)) {
    const rawHref = decodeHtmlEntities(match[1]?.trim() ?? "");
    if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("javascript:")) continue;
    let href: string;
    try {
      href = new URL(rawHref, pageUrl).toString();
    } catch {
      continue;
    }
    const label = stripTags(match[2] || "");
    const doc = classifyLink(label, href);
    if (!doc || seen.has(doc.url)) continue;
    seen.add(doc.url);
    documents.push(doc);
  }

  const linkCount = [...html.matchAll(/<a\s+[^>]*href=/gi)].length;
  const openAnchors = [...html.matchAll(/inscri[çc][õo]es?\s+abertas?/gi)].length;
  const avgLabel =
    documents.length === 0
      ? 0
      : documents.reduce((n, d) => n + d.label.length, 0) / Math.max(1, documents.length);
  const editalDocs = documents.filter((d) => d.kindHint === "edital").length;
  const looksLikeListing =
    editalDocs === 0 &&
    (linkCount > 40 ||
      (openAnchors >= 3 && linkCount >= 4) ||
      (documents.length === 0 && openAnchors >= 2 && avgLabel < 80));

  return {
    title,
    org,
    editionKey,
    examSlug,
    examKind,
    registrationEnd: window?.end ?? null,
    status: examKind === "concurso" || examKind === "oab" ? status : "unknown",
    statusSource,
    positions,
    documents,
    looksLikeListing,
  };
}
