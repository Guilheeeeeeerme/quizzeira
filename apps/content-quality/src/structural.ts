// Concept: Structural validation (deterministic, pre-LLM gate)
//
// Cheap, explainable checks that need no model call. Anything that fails here
// is rejected outright, which keeps LLM-as-judge spend off items that were
// never going to be usable. Every rejection carries a machine-readable reason
// so the HITL queue can be filtered and counted.
import { looksLikeListingTriviaStem } from "@quizzeira/shared";
export type StructuralReason =
  | "prompt_too_short"
  | "prompt_too_long"
  | "prompt_references_context"
  | "missing_options"
  | "too_few_options"
  | "too_many_options"
  | "duplicate_options"
  | "blank_option"
  | "correct_index_out_of_range"
  | "banned_option_phrase"
  | "option_length_outlier"
  | "option_length_ratio"
  | "missing_reference_answer"
  | "placeholder_text"
  | "passage_required"
  | "distractor_rationale_missing"
  | "knowledge_unit_ids_missing"
  | "tests_exam_metadata";

export interface StructuralInput {
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options?: string[] | null;
  correctIndex?: number | null;
  referenceAnswer?: string | null;
  explanation?: string | null;
  origin?: "extraction" | "generation" | "transcription" | string | null;
  /** Interpretation / reading-comprehension leaf → passage required. */
  requiresPassage?: boolean | null;
  passage?: string | null;
  distractorRationale?: string[] | null;
  /** Generation drafts must cite knowledge units (§25.1). */
  knowledgeUnitIds?: string[] | null;
}

export interface StructuralResult {
  ok: boolean;
  reasons: StructuralReason[];
  notes: string;
}

export const MIN_PROMPT_CHARS = 30;
export const MAX_PROMPT_CHARS = 4000;
export const MIN_OPTIONS = 4;
export const MAX_OPTIONS = 5;

/**
 * "All/none of the above" style options make an item unusable once we shuffle
 * or resample alternatives, so they are rejected rather than repaired.
 */
const BANNED_OPTION_PATTERNS = [
  /\btodas\s+as\s+(alternativas|anteriores)\b/i,
  /\bnenhuma\s+das\s+(alternativas|anteriores)\b/i,
  /\ball\s+of\s+the\s+above\b/i,
  /\bnone\s+of\s+the\s+above\b/i,
];

/** A generated item must stand alone; it cannot point back at the source text. */
const CONTEXT_REFERENCE_PATTERNS = [
  /\bo\s+trecho\s+(acima|abaixo)\b/i,
  /\bno\s+texto\s+(acima|abaixo)\b/i,
  /\bconforme\s+o\s+material\s+(acima|fornecido)\b/i,
  /\bsegundo\s+o\s+trecho\b/i,
  /\bthe\s+(passage|excerpt)\s+above\b/i,
];

const PLACEHOLDER_PATTERNS = [/\blorem\s+ipsum\b/i, /\bTODO\b/, /\bXXX+\b/, /^\s*\.{3,}\s*$/];

export function validateStructure(input: StructuralInput): StructuralResult {
  const reasons: StructuralReason[] = [];
  const prompt = (input.prompt ?? "").trim();
  const options = (input.options ?? []).map((o) => String(o ?? ""));

  if (prompt.length < MIN_PROMPT_CHARS) reasons.push("prompt_too_short");
  if (prompt.length > MAX_PROMPT_CHARS) reasons.push("prompt_too_long");
  if (CONTEXT_REFERENCE_PATTERNS.some((re) => re.test(prompt))) {
    reasons.push("prompt_references_context");
  }
  if (PLACEHOLDER_PATTERNS.some((re) => re.test(prompt))) reasons.push("placeholder_text");

  // §43.2.3 listing-trivia denylist — fail early so Eval never spends on REG stems.
  if (
    looksLikeListingTriviaStem(prompt) ||
    options.some((o) => o.trim() && looksLikeListingTriviaStem(o))
  ) {
    reasons.push("tests_exam_metadata");
  }

  if (input.origin === "generation") {
    const kuIds = (input.knowledgeUnitIds ?? []).filter(
      (id) => typeof id === "string" && id.trim().length > 0,
    );
    if (kuIds.length === 0) reasons.push("knowledge_unit_ids_missing");
  }

  if (input.type === "MULTIPLE_CHOICE") {
    if (options.length === 0) {
      reasons.push("missing_options");
    } else {
      if (options.length < MIN_OPTIONS) reasons.push("too_few_options");
      if (options.length > MAX_OPTIONS) reasons.push("too_many_options");
      if (options.some((o) => !o || !o.trim())) reasons.push("blank_option");

      const normalized = options.map((o) => o.trim().toLowerCase());
      if (new Set(normalized).size !== normalized.length) reasons.push("duplicate_options");
      if (options.some((o) => BANNED_OPTION_PATTERNS.some((re) => re.test(o)))) {
        reasons.push("banned_option_phrase");
      }
      if (isLengthOutlier(options)) reasons.push("option_length_outlier");
      if (isLengthRatioFail(options)) reasons.push("option_length_ratio");

      const index = input.correctIndex;
      if (index == null || !Number.isInteger(index) || index < 0 || index >= options.length) {
        reasons.push("correct_index_out_of_range");
      }

      if (input.origin === "generation") {
        const rationales = (input.distractorRationale ?? []).filter((r) => String(r || "").trim());
        const needed = Math.max(0, options.length - 1);
        if (rationales.length < needed) {
          reasons.push("distractor_rationale_missing");
        }
      }
    }
  } else if (!input.referenceAnswer?.trim()) {
    reasons.push("missing_reference_answer");
  }

  if (input.requiresPassage && !String(input.passage ?? "").trim()) {
    reasons.push("passage_required");
  }

  return {
    ok: reasons.length === 0,
    reasons,
    notes: reasons.length === 0 ? "structural checks passed" : describe(reasons),
  };
}

/**
 * A correct answer that is far longer than every distractor is a giveaway —
 * test-takers pick the long one without reading. Flags a >2.5x ratio against
 * the mean of the others (legacy).
 */
export function isLengthOutlier(options: string[]): boolean {
  if (options.length < 3) return false;
  const lengths = options.map((o) => o.trim().length);
  const longest = Math.max(...lengths);
  const others = lengths.filter((l) => l !== longest);
  if (others.length === 0) return false;
  const mean = others.reduce((a, b) => a + b, 0) / others.length;
  return mean > 0 && longest / mean > 2.5;
}

/** Spec §25.1: option_length_ratio > 2.0 fails (tightened). */
export function isLengthRatioFail(options: string[]): boolean {
  if (options.length < 3) return false;
  const lengths = options.map((o) => o.trim().length).filter((l) => l > 0);
  if (lengths.length < 3) return false;
  const max = Math.max(...lengths);
  const min = Math.min(...lengths);
  return min > 0 && max / min > 2.0;
}

const REASON_TEXT: Record<StructuralReason, string> = {
  prompt_too_short: `enunciado com menos de ${MIN_PROMPT_CHARS} caracteres`,
  prompt_too_long: `enunciado com mais de ${MAX_PROMPT_CHARS} caracteres`,
  prompt_references_context: "enunciado faz referência ao material de origem",
  missing_options: "questão de múltipla escolha sem alternativas",
  too_few_options: `menos de ${MIN_OPTIONS} alternativas`,
  too_many_options: `mais de ${MAX_OPTIONS} alternativas`,
  duplicate_options: "alternativas duplicadas",
  blank_option: "alternativa vazia",
  correct_index_out_of_range: "índice da alternativa correta inválido",
  banned_option_phrase: "alternativa do tipo 'todas/nenhuma das anteriores'",
  option_length_outlier: "alternativa correta muito mais longa que as demais",
  option_length_ratio: "razão de comprimento entre alternativas acima do limite",
  missing_reference_answer: "questão aberta sem resposta de referência",
  placeholder_text: "texto de preenchimento (placeholder) no enunciado",
  passage_required: "subtópico de interpretação exige texto-base (passage)",
  distractor_rationale_missing: "distratores sem justificativa (origem geração)",
  knowledge_unit_ids_missing: "item gerado sem unidades de conhecimento citadas",
  tests_exam_metadata:
    "item testa metadados do concurso (vagas, inscrições, banca) em vez de conhecimento",
};

export function describe(reasons: StructuralReason[]): string {
  return reasons.map((r) => REASON_TEXT[r]).join("; ");
}
