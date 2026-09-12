// Concept: Reason-code catalogue (§25.6). Every rejection anywhere in Eval is one
// of these codes, so the HITL queue, metrics and regression tests can count them.

export const STRUCTURAL_REASONS = [
  "prompt_too_short",
  "prompt_too_long",
  "prompt_references_context",
  "missing_options",
  "too_few_options",
  "too_many_options",
  "duplicate_options",
  "blank_option",
  "correct_index_out_of_range",
  "banned_option_phrase",
  "option_length_outlier",
  "missing_reference_answer",
  "placeholder_text",
  "option_length_ratio",
  "passage_required",
  "distractor_rationale_missing",
  "knowledge_unit_ids_missing",
] as const;

export const RELEVANCE_REASONS = [
  "off_syllabus",
  "tests_exam_metadata",
  "tests_syllabus_meta",
  "temporally_dependent",
  "copied_previous_question",
  "duplicate_question",
] as const;

export const GROUNDING_REASONS = [
  "ungrounded_citation",
  "unsupported_specific",
  "verbatim_answer",
  "distractor_is_true",
] as const;

export const JUDGE_REASONS = [
  "judge_answer_mismatch",
  "judge_low_relevance",
  "judge_low_durability",
  "judge_low_grounding",
  "judge_score_below_floor",
  "judge_score_borderline",
  "judge_unavailable",
] as const;

export const LEGACY_REASONS = ["legacy_pre_redesign", "extraction_without_judge", "structural_ok"] as const;

export type StructuralReasonCode = (typeof STRUCTURAL_REASONS)[number];
export type RelevanceReasonCode = (typeof RELEVANCE_REASONS)[number];
export type GroundingReasonCode = (typeof GROUNDING_REASONS)[number];
export type JudgeReasonCode = (typeof JUDGE_REASONS)[number];
export type ReasonCode =
  | StructuralReasonCode
  | RelevanceReasonCode
  | GroundingReasonCode
  | JudgeReasonCode
  | (typeof LEGACY_REASONS)[number];

export const REASON_DESCRIPTIONS: Record<ReasonCode, string> = {
  prompt_too_short: "enunciado curto demais",
  prompt_too_long: "enunciado longo demais",
  prompt_references_context: "enunciado faz referência ao material de origem",
  missing_options: "questão de múltipla escolha sem alternativas",
  too_few_options: "alternativas de menos",
  too_many_options: "alternativas demais",
  duplicate_options: "alternativas duplicadas",
  blank_option: "alternativa vazia",
  correct_index_out_of_range: "índice da alternativa correta inválido",
  banned_option_phrase: "alternativa do tipo 'todas/nenhuma das anteriores'",
  option_length_outlier: "alternativa correta muito mais longa que as demais",
  missing_reference_answer: "questão aberta sem resposta de referência",
  placeholder_text: "texto de preenchimento (placeholder) no enunciado",
  option_length_ratio: "alternativas com comprimentos desproporcionais (> 2x)",
  passage_required: "questão de interpretação sem o texto-base embutido",
  distractor_rationale_missing: "distratores sem justificativa de erro",
  knowledge_unit_ids_missing: "item gerado sem citar unidades de conhecimento",
  off_syllabus: "item não aponta para uma folha ativa do conteúdo programático",
  tests_exam_metadata:
    "item testa metadados do concurso (banca, vagas, salário, datas, taxa, requisitos)",
  tests_syllabus_meta: "item pergunta quais assuntos constam no programa, não o conteúdo",
  temporally_dependent: "resposta depende de informação temporária (ano, 'atualmente')",
  copied_previous_question: "item copia uma questão de prova anterior",
  duplicate_question: "item quase idêntico a outro já existente na mesma folha",
  ungrounded_citation: "item cita unidades de conhecimento que não estavam no briefing",
  unsupported_specific: "número, lei, artigo ou data não consta nas unidades citadas",
  verbatim_answer: "alternativa correta é cópia literal da unidade de conhecimento",
  distractor_is_true: "um distrator é afirmado como verdadeiro pelas unidades citadas",
  judge_answer_mismatch: "o juiz respondeu uma alternativa diferente da gabaritada",
  judge_low_relevance: "o juiz considerou o item fora do subtópico",
  judge_low_durability: "o juiz considerou que o item testa informação do edital, não conhecimento",
  judge_low_grounding: "o juiz não encontrou suporte nas unidades citadas",
  judge_score_below_floor: "nota do juiz abaixo do mínimo",
  judge_score_borderline: "nota do juiz na faixa de revisão humana",
  judge_unavailable: "juiz LLM indisponível",
  legacy_pre_redesign: "item publicado pelo pipeline anterior ao redesenho; requer revisão",
  extraction_without_judge: "publicado a partir de extração sem juiz LLM",
  structural_ok: "checagens estruturais aprovadas",
};

/** Reasons that fail an item outright before the judge ever runs (§25.5). */
export const HARD_FAIL_REASONS: ReadonlySet<string> = new Set<string>([
  ...STRUCTURAL_REASONS,
  "off_syllabus",
  "tests_exam_metadata",
  "tests_syllabus_meta",
  "copied_previous_question",
  "duplicate_question",
  "ungrounded_citation",
  "unsupported_specific",
  "verbatim_answer",
  "distractor_is_true",
]);

/** Reasons that park the item for a human instead of failing it. */
export const REVIEW_REASONS: ReadonlySet<string> = new Set<string>(["temporally_dependent"]);

export function describeReasons(reasons: readonly string[]): string {
  return reasons
    .map((r) => REASON_DESCRIPTIONS[r as ReasonCode] ?? r)
    .join("; ");
}
