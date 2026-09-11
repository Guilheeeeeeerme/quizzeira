// Concept: Structural validation (deterministic, pre-LLM gate)
//
// Cheap, explainable checks that need no model call. Anything that fails here
// is rejected outright, which keeps LLM-as-judge spend off items that were
// never going to be usable. Every rejection carries a machine-readable reason
// so the HITL queue can be filtered and counted.
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
  | "missing_reference_answer"
  | "placeholder_text";

export interface StructuralInput {
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options?: string[] | null;
  correctIndex?: number | null;
  referenceAnswer?: string | null;
  explanation?: string | null;
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

  if (prompt.length < MIN_PROMPT_CHARS) reasons.push("prompt_too_short");
  if (prompt.length > MAX_PROMPT_CHARS) reasons.push("prompt_too_long");
  if (CONTEXT_REFERENCE_PATTERNS.some((re) => re.test(prompt))) {
    reasons.push("prompt_references_context");
  }
  if (PLACEHOLDER_PATTERNS.some((re) => re.test(prompt))) reasons.push("placeholder_text");

  if (input.type === "MULTIPLE_CHOICE") {
    const options = input.options ?? [];
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

      const index = input.correctIndex;
      if (index == null || !Number.isInteger(index) || index < 0 || index >= options.length) {
        reasons.push("correct_index_out_of_range");
      }
    }
  } else if (!input.referenceAnswer?.trim()) {
    reasons.push("missing_reference_answer");
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
 * the mean of the others.
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
  missing_reference_answer: "questão aberta sem resposta de referência",
  placeholder_text: "texto de preenchimento (placeholder) no enunciado",
};

export function describe(reasons: StructuralReason[]): string {
  return reasons.map((r) => REASON_TEXT[r]).join("; ");
}
