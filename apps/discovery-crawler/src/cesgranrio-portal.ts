// Concept: banca-specific detail enrichment (§11.2.3) for the Cesgranrio
// candidate portal. Its concurso pages are a JS app; the editais live in a
// public JSON API whose sections carry HTML tables of PDF links.

import { extractDocumentLinks, type DocumentLinkCandidate } from "./detail.js";

const PORTAL_RE = /concursos\.cesgranrio\.org\.br\/portal\/(?:avaliacoes|inscricao)\/(\d+)/i;
const API_BASE = "https://concursos.cesgranrio.org.br";

/** Portal event id referenced by a Cesgranrio concurso page (or the portal URL itself). */
export function cesgranrioPortalEventId(html: string, url: string): string | null {
  return url.match(PORTAL_RE)?.[1] ?? html.match(PORTAL_RE)?.[1] ?? null;
}

interface PortalContent {
  titulo?: string;
  texto?: string;
}

/** Documents from `/api/PortalEventoConteudos/publico/:id` payloads (v1 shape: `{data:[…]}` or `[…]`). */
export function parseCesgranrioPortalContents(payload: unknown): DocumentLinkCandidate[] {
  const rows: PortalContent[] = Array.isArray(payload)
    ? (payload as PortalContent[])
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: PortalContent[] }).data)
      : [];
  const out: DocumentLinkCandidate[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    if (typeof row?.texto !== "string") continue;
    for (const doc of extractDocumentLinks(row.texto, API_BASE)) {
      if (!/\.pdf(\?|#|$)/i.test(doc.url)) continue;
      if (seen.has(doc.url)) continue;
      seen.add(doc.url);
      // "ACESSE AQUI" cells sit next to an edital title; inherit the row context.
      const anchorLabel = /acesse\s+aqui/i.test(doc.anchorLabel)
        ? `${row.titulo ?? "documento"} (anexo)`
        : doc.anchorLabel;
      out.push({ ...doc, anchorLabel });
    }
  }
  return out;
}

export async function fetchCesgranrioPortalDocuments(
  eventId: string,
): Promise<DocumentLinkCandidate[]> {
  try {
    const res = await fetch(`${API_BASE}/api/PortalEventoConteudos/publico/${eventId}`, {
      headers: {
        accept: "application/json",
        "user-agent": "QuizzeiraDiscoveryCrawler/0.1 (+research; polite)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    return parseCesgranrioPortalContents(await res.json());
  } catch {
    return [];
  }
}


/** One edital row of a Cesgranrio portal event: its own concurso (§11.2.2). */
export interface PortalEdital {
  number: number;
  label: string;
  /** e.g. "2026.4" from "TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR - 2026.4". */
  editionKey: string | null;
  /** Catalog categories: Mar / Terra, nível médio / técnico / superior. */
  emphasis: string[];
  documentLinks: DocumentLinkCandidate[];
}

const EDITAL_LABEL_RE = /EDITAL\s+N[ºo°.]?\s*0*(\d+)/i;

function textOfHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Mar/Terra + nível tags from an edital label — these are the study categories. */
export function categorizeEditalLabel(label: string): string[] {
  const out: string[] = [];
  if (/\bMAR\b/i.test(label)) out.push("Mar");
  if (/\bTERRA\b/i.test(label)) out.push("Terra");
  if (/N[ÍI]VEL\s+M[ÉE]DIO/i.test(label)) out.push("Nível médio");
  if (/N[ÍI]VEL\s+T[ÉE]CNICO/i.test(label)) out.push("Nível técnico");
  if (/N[ÍI]VEL\s+SUPERIOR/i.test(label)) out.push("Nível superior");
  return out;
}

/**
 * Split the "ACESSO AOS EDITAIS" table into one entry per "EDITAL Nº N" row
 * (first cell = edital PDF, third cell = cronograma) and attach retificações
 * whose label names that edital number.
 */
export function parseCesgranrioPortalEditais(payload: unknown): PortalEdital[] {
  const rows: PortalContent[] = Array.isArray(payload)
    ? (payload as PortalContent[])
    : Array.isArray((payload as { data?: unknown })?.data)
      ? ((payload as { data: PortalContent[] }).data)
      : [];
  const byNumber = new Map<number, PortalEdital>();

  for (const section of rows) {
    if (typeof section?.texto !== "string") continue;
    const isEditais = /EDITAIS/i.test(section.titulo ?? "");
    const isRetificacoes = /RETIFICA/i.test(section.titulo ?? "");
    if (!isEditais && !isRetificacoes) continue;
    const html = section.texto.replace(/<style[\s\S]*?<\/style>/gi, "");
    for (const tr of html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) ?? [];
      const first = cells[0] ?? "";
      if (isEditais) {
        const links = extractDocumentLinks(first, API_BASE).filter((d) => /\.pdf(\?|#|$)/i.test(d.url));
        const label = textOfHtml(first);
        const m = label.match(EDITAL_LABEL_RE);
        if (!m || links.length === 0 || /CONVOCA[ÇC][ÃA]O/i.test(label)) continue;
        const number = Number(m[1]);
        const editionKey = label.match(/\b(20\d{2}(?:\.\d+)?)\b/)?.[1] ?? null;
        byNumber.set(number, {
          number,
          label,
          editionKey,
          emphasis: categorizeEditalLabel(label),
          documentLinks: links.map((d) => ({
            ...d,
            anchorLabel: label,
            kindHint: "edital",
            roleHint: "specification",
          })),
        });
      } else {
        for (const doc of extractDocumentLinks(first, API_BASE)) {
          if (!/\.pdf(\?|#|$)/i.test(doc.url)) continue;
          const m = doc.anchorLabel.match(EDITAL_LABEL_RE);
          const target = m ? byNumber.get(Number(m[1])) : undefined;
          if (!target) continue;
          target.documentLinks.push({
            ...doc,
            kindHint: "retificacao",
            roleHint: "specification",
          });
        }
      }
    }
  }
  return [...byNumber.values()].sort((a, b) => a.number - b.number);
}

export async function fetchCesgranrioPortalEditais(eventId: string): Promise<PortalEdital[]> {
  try {
    const res = await fetch(`${API_BASE}/api/PortalEventoConteudos/publico/${eventId}`, {
      headers: {
        accept: "application/json",
        "user-agent": "QuizzeiraDiscoveryCrawler/0.1 (+research; polite)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return [];
    return parseCesgranrioPortalEditais(await res.json());
  } catch {
    return [];
  }
}
