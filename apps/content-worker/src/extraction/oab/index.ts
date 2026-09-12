// Concept: Extraction (OAB module entry point)
//
// The generic path drafts a past exam from whatever single document it is
// holding. That never works for the OAB, where the questions and the key are
// always two separate PDFs published weeks apart. So this module is document-
// pair driven: whichever half arrives second pulls the other from Content and
// completes the join.
//
// Re-drafting is safe — Content fingerprints items — which is what lets the
// four booklet types of one edition all be processed and still yield 80
// questions, and what lets a caderno be retried once its gabarito lands.
import { OAB_SLUG_PREFIX, type OabPhase } from "@quizzeira/shared";
import { parseCadernoPdf } from "./caderno.js";
import { objectiveDrafts, practicalDrafts, type OabDraftGroup } from "./drafts.js";
import { parseGabaritoPdf, type GabaritoParseResult } from "./gabarito.js";
import { parsePadraoPdf } from "./padrao.js";

export * from "./caderno.js";
export * from "./drafts.js";
export * from "./gabarito.js";
export * from "./padrao.js";
export { extractLayoutText } from "./pdf-layout.js";

export interface OabDocumentRef {
  id: string;
  examSlug: string;
  kind: string;
  storageKey?: string | null;
  sourceUrl?: string | null;
  contentType?: string | null;
}

/** Content-side operations the module needs; injected so the join is testable. */
export interface OabExtractionDeps {
  listDocuments(examSlug: string, kind: string): Promise<OabDocumentRef[]>;
  documentBytes(documentId: string): Promise<Buffer>;
  draft(input: {
    examSlug: string;
    documentId: string;
    group: OabDraftGroup;
  }): Promise<number>;
}

export interface OabExtractionResult {
  drafted: number;
  /** Why nothing was drafted, for the worker log. Null on success. */
  pending: string | null;
}

/** OAB exam slugs are namespaced, so the module never claims another exam's documents. */
export function isOabExamSlug(examSlug: string): boolean {
  return examSlug.startsWith(`${OAB_SLUG_PREFIX}-`);
}

export function oabPhaseFromExamSlug(examSlug: string): OabPhase | null {
  if (!isOabExamSlug(examSlug)) return null;
  if (examSlug.endsWith("-2-fase")) return "practical";
  if (examSlug.endsWith("-1-fase")) return "objective";
  return null;
}

const NOTHING: OabExtractionResult = { drafted: 0, pending: null };

/**
 * Drafts everything the arrival of `document` makes possible.
 *
 * Returns `pending` rather than throwing when the other half of the pair is
 * missing: that is the normal state between the exam and the key being
 * published, not a failure of this document.
 */
export async function extractOabDocument(
  document: OabDocumentRef,
  bytes: Buffer,
  deps: OabExtractionDeps,
): Promise<OabExtractionResult> {
  const phase = oabPhaseFromExamSlug(document.examSlug);
  if (!phase) return NOTHING;

  if (phase === "practical") {
    // The 2ª fase caderno holds enunciados only; the padrão holds both halves,
    // so it is the only practical document that yields a complete item.
    if (document.kind !== "gabarito") return NOTHING;
    const groups = practicalDrafts(parsePadraoPdf(bytes));
    if (groups.length === 0) return { drafted: 0, pending: "padrão yielded no complete item" };
    return { drafted: await publish(document, groups, deps), pending: null };
  }

  if (document.kind === "prova") {
    const gabarito = await loadGabarito(document.examSlug, deps);
    if (!gabarito) return { drafted: 0, pending: "no gabarito ingested for this edition yet" };
    return draftBooklet(document, bytes, gabarito, deps);
  }

  if (document.kind === "gabarito") {
    // The key landed after the booklets: complete every caderno already stored.
    const gabarito = parseGabaritoPdf(bytes);
    if (gabarito.answersByType.size === 0) {
      return { drafted: 0, pending: "no answer grid found in gabarito" };
    }
    const provas = await deps.listDocuments(document.examSlug, "prova");
    if (provas.length === 0) return { drafted: 0, pending: "no caderno ingested for this edition yet" };

    let drafted = 0;
    for (const prova of provas) {
      const bookletBytes = await deps.documentBytes(prova.id).catch(() => null);
      if (!bookletBytes) continue;
      const result = await draftBooklet(prova, bookletBytes, gabarito, deps);
      drafted += result.drafted;
    }
    return { drafted, pending: drafted === 0 ? "no caderno could be paired with this key" : null };
  }

  return NOTHING;
}

async function draftBooklet(
  document: OabDocumentRef,
  bytes: Buffer,
  gabarito: GabaritoParseResult,
  deps: OabExtractionDeps,
): Promise<OabExtractionResult> {
  const caderno = parseCadernoPdf(bytes);
  if (caderno.questions.length === 0) {
    return { drafted: 0, pending: "caderno yielded no question" };
  }
  const { groups } = objectiveDrafts(caderno, gabarito);
  if (groups.length === 0) {
    return { drafted: 0, pending: "booklet numbering could not be canonicalized" };
  }
  return { drafted: await publish(document, groups, deps), pending: null };
}

/**
 * Picks the edition's answer key. The definitive one supersedes the preliminary
 * one — publishing from a preliminary key would mark annulled questions correct.
 */
async function loadGabarito(
  examSlug: string,
  deps: OabExtractionDeps,
): Promise<GabaritoParseResult | null> {
  const candidates = await deps.listDocuments(examSlug, "gabarito");
  let fallback: GabaritoParseResult | null = null;

  for (const candidate of candidates) {
    const bytes = await deps.documentBytes(candidate.id).catch(() => null);
    if (!bytes) continue;
    const parsed = parseGabaritoPdf(bytes);
    if (parsed.answersByType.size === 0) continue;
    if (parsed.definitive) return parsed;
    fallback ??= parsed;
  }

  return fallback;
}

async function publish(
  document: OabDocumentRef,
  groups: OabDraftGroup[],
  deps: OabExtractionDeps,
): Promise<number> {
  let drafted = 0;
  for (const group of groups) {
    drafted += await deps.draft({
      examSlug: document.examSlug,
      documentId: document.id,
      group,
    });
  }
  return drafted;
}
