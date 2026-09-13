// Concept: Validation reason codes — machine-readable rejection catalogue (§25.6).
//
// Shared between content-quality, admin UI, and metrics. Structural reasons from
// the existing validator are included so one registry covers the full ladder.

/** All known quality / validation reason codes. */
export const REASON_CODES = [
  // Rung 1 — structural (existing)
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
  "option_length_ratio",
  "missing_reference_answer",
  "placeholder_text",
  "passage_required",
  "distractor_rationale_missing",
  "knowledge_unit_ids_missing",
  // Rung 2 — syllabus and durability
  "off_syllabus",
  "tests_exam_metadata",
  "tests_syllabus_meta",
  "temporally_dependent",
  "copied_previous_question",
  "duplicate_question",
  // Rung 3 — grounding
  "ungrounded_citation",
  "unsupported_specific",
  "verbatim_answer",
  "distractor_is_true",
  // Rung 4 — judge
  "judge_answer_mismatch",
  "judge_low_relevance",
  "judge_low_durability",
  "judge_low_grounding",
  "judge_score_below_floor",
  "judge_score_borderline",
  "judge_unavailable",
  // Ops / cutover
  "legacy_pre_redesign",
] as const;

export type ReasonCode = (typeof REASON_CODES)[number];

/** Portuguese descriptions for admin UI and logs. */
export const REASON_DESCRIPTIONS_PT: Record<ReasonCode, string> = {
  prompt_too_short: "enunciado com menos caracteres que o mínimo exigido",
  prompt_too_long: "enunciado com mais caracteres que o máximo permitido",
  prompt_references_context: "enunciado faz referência ao material de origem",
  missing_options: "questão de múltipla escolha sem alternativas",
  too_few_options: "menos alternativas que o mínimo exigido",
  too_many_options: "mais alternativas que o máximo permitido",
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
  off_syllabus: "nó de currículo inválido ou não folha do edital ativo",
  tests_exam_metadata:
    "item testa metadados do concurso (vagas, inscrições, banca, edital) em vez de conhecimento",
  tests_syllabus_meta:
    "item pergunta sobre o conteúdo programático ou matérias do edital, não sobre o assunto",
  temporally_dependent:
    "item depende de data ou vigência atual sem citação legal estável",
  copied_previous_question: "cópia ou paráfrase próxima de questão de prova anterior",
  duplicate_question: "duplicata exata ou quase duplicata de item já publicado na folha",
  ungrounded_citation: "citação a unidade de conhecimento inexistente ou não vinculada",
  unsupported_specific: "valor específico no enunciado sem suporte nas unidades citadas",
  verbatim_answer: "alternativa correta é substring longa de uma unidade citada (reconhecimento)",
  distractor_is_true: "distrator verdadeiro dado o conhecimento citado",
  judge_answer_mismatch: "juiz LLM discorda da alternativa marcada como correta",
  judge_low_relevance: "juiz LLM: item não trata do subtópico solicitado",
  judge_low_durability: "juiz LLM: item testa informação administrativa ou efêmera",
  judge_low_grounding: "juiz LLM: resposta não sustentada pelas unidades citadas",
  judge_score_below_floor: "pontuação do juiz abaixo do piso de publicação",
  judge_score_borderline: "pontuação do juiz na zona de revisão humana",
  judge_unavailable: "juiz LLM indisponível ou resposta inválida",
  legacy_pre_redesign: "item de geração anterior ao redesenho; revalidar ou arquivar",
};

export function isReasonCode(value: string): value is ReasonCode {
  return (REASON_CODES as readonly string[]).includes(value);
}

export function describeReason(code: ReasonCode): string {
  return REASON_DESCRIPTIONS_PT[code];
}

export function describeReasons(codes: readonly string[]): string {
  return codes
    .map((c) => (isReasonCode(c) ? describeReason(c) : c))
    .join("; ");
}
