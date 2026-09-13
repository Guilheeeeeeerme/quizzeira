// Concept: Validation rung 3 — grounding (§25.3 / §24.5).
//
// Deterministic: citation subset, specific-value support, verbatim answer,
// distractor-is-true (lexical overlap).

import type { ReasonCode } from "@quizzeira/shared";

export type GroundingReason = Extract<
  ReasonCode,
  "ungrounded_citation" | "unsupported_specific" | "verbatim_answer" | "distractor_is_true"
>;

export interface GroundingInput {
  origin?: "extraction" | "generation" | "transcription" | string | null;
  knowledgeUnitIds?: string[] | null;
  /** Allowed KU ids from the generation brief / leaf (subset check). */
  allowedKnowledgeUnitIds?: string[] | null;
  /** Statements for cited KUs (for specific-value / verbatim / distractor). */
  knowledgeUnitStatements?: string[] | null;
  prompt?: string | null;
  options?: string[] | null;
  correctIndex?: number | null;
}

export interface GroundingResult {
  ok: boolean;
  reasons: GroundingReason[];
  notes: string;
}

function hasCitations(ids: string[] | null | undefined): boolean {
  return Array.isArray(ids) && ids.some((id) => typeof id === "string" && id.trim().length > 0);
}

function normalizeIds(ids: string[] | null | undefined): string[] {
  if (!Array.isArray(ids)) return [];
  return ids.map((id) => String(id).trim()).filter(Boolean);
}

/** Extract numbers, Lei N, Art. N, and dates that must appear in cited KUs. */
export function extractSpecificValues(text: string): string[] {
  const values = new Set<string>();
  const patterns = [
    /\bLei\s+n[ºo°.]?\s*[\d.]+\/?\d*/gi,
    /\bArt\.?\s*\d+[ºoª°]?/gi,
    /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g,
    /\b\d{4}\b/g,
    /\bR\$\s*[\d.,]+/gi,
    /\b\d+[.,]\d+\b/g,
  ];
  for (const re of patterns) {
    for (const m of text.matchAll(re)) {
      values.add(m[0].replace(/\s+/g, " ").trim().toLowerCase());
    }
  }
  return [...values];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalizeForOverlap(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Token Jaccard overlap in [0,1]. */
export function lexicalOverlap(a: string, b: string): number {
  const ta = new Set(normalizeForOverlap(a).split(" ").filter((t) => t.length > 2));
  const tb = new Set(normalizeForOverlap(b).split(" ").filter((t) => t.length > 2));
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

const NOTES: Record<GroundingReason, string> = {
  ungrounded_citation: "citações ausentes ou fora do conjunto permitido",
  unsupported_specific: "valor específico no enunciado sem suporte nas KUs citadas",
  verbatim_answer: "alternativa correta é substring longa de uma KU citada",
  distractor_is_true: "distrator com sobreposição lexical alta com KU citada",
};

/** Generation items must cite KUs; citations must be a brief subset; content grounded. */
export function validateGrounding(input: GroundingInput): GroundingResult {
  const reasons: GroundingReason[] = [];

  if (input.origin !== "generation") {
    return { ok: true, reasons: [], notes: "grounding skipped for non-generation origin" };
  }

  const cited = normalizeIds(input.knowledgeUnitIds);
  if (cited.length === 0) {
    reasons.push("ungrounded_citation");
  }

  const allowed = normalizeIds(input.allowedKnowledgeUnitIds);
  if (cited.length > 0 && allowed.length > 0) {
    const allow = new Set(allowed);
    if (cited.some((id) => !allow.has(id))) {
      reasons.push("ungrounded_citation");
    }
  }

  const statements = (input.knowledgeUnitStatements ?? [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);
  const prompt = String(input.prompt ?? "");
  const options = Array.isArray(input.options) ? input.options.map(String) : [];
  const correctIndex =
    typeof input.correctIndex === "number" && Number.isInteger(input.correctIndex)
      ? input.correctIndex
      : null;

  if (statements.length > 0 && prompt) {
    const corpus = statements.join("\n").toLowerCase();
    // Specifics are checked on the stem (+ passage), not distractors — wrong options
    // often invent numbers by design.
    const specifics = extractSpecificValues(prompt);
    for (const value of specifics) {
      // Skip bare years that are too common without a Lei/Art. nearby in the same token set.
      if (/^\d{4}$/.test(value) && !/lei|art/.test(prompt.toLowerCase())) continue;
      if (!corpus.includes(value)) {
        reasons.push("unsupported_specific");
        break;
      }
    }
  }

  if (correctIndex != null && options[correctIndex] && statements.length > 0) {
    const correct = options[correctIndex].trim();
    if (wordCount(correct) > 12) {
      const normCorrect = normalizeForOverlap(correct);
      for (const stmt of statements) {
        if (normalizeForOverlap(stmt).includes(normCorrect)) {
          reasons.push("verbatim_answer");
          break;
        }
      }
    }
  }

  if (correctIndex != null && options.length > 0 && statements.length > 0) {
    for (let i = 0; i < options.length; i++) {
      if (i === correctIndex) continue;
      const distractor = options[i]?.trim();
      if (!distractor || wordCount(distractor) < 4) continue;
      for (const stmt of statements) {
        if (lexicalOverlap(distractor, stmt) >= 0.8) {
          reasons.push("distractor_is_true");
          break;
        }
      }
      if (reasons.includes("distractor_is_true")) break;
    }
  }

  const unique = [...new Set(reasons)];
  return {
    ok: unique.length === 0,
    reasons: unique,
    notes: unique.length === 0 ? "grounding checks passed" : unique.map((r) => NOTES[r]).join("; "),
  };
}
