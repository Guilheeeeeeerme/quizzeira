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
