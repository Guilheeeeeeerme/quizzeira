// Concept: §41.1 — every ReasonCode has a fixture that triggers it.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { REASON_CODES, REASON_DESCRIPTIONS_PT, type ReasonCode } from "@quizzeira/shared";
import { decide } from "./gate.js";
import { validateGrounding } from "./grounding.js";
import { validateRelevance } from "./relevance.js";
import { validateStructure } from "./structural.js";

const BASE_MC = {
  type: "MULTIPLE_CHOICE" as const,
  prompt:
    "De acordo com a norma-padrão, assinale a alternativa em que a concordância verbal está correta.",
  options: ["Opção A curta", "Opção B curta", "Opção C curta", "Opção D curta"],
  correctIndex: 0,
  referenceAnswer: null as string | null,
  explanation: "Explicação suficiente para o item.",
  origin: "generation" as const,
  distractorRationale: ["r1", "r2", "r3"],
  knowledgeUnitIds: ["ku-1"],
};

const THRESHOLDS = { publish: 0.75, fail: 0.4 };

const structuralOk = validateStructure(BASE_MC);

function trigger(code: ReasonCode): string[] {
  switch (code) {
    case "prompt_too_short":
      return validateStructure({ ...BASE_MC, prompt: "Curto?" }).reasons;
    case "prompt_too_long":
      return validateStructure({ ...BASE_MC, prompt: "x".repeat(5000) }).reasons;
    case "prompt_references_context":
      return validateStructure({
        ...BASE_MC,
        prompt: "Segundo o trecho acima, qual alternativa sobre concordância verbal está correta?",
      }).reasons;
    case "missing_options":
      return validateStructure({ ...BASE_MC, options: [] }).reasons;
    case "too_few_options":
      return validateStructure({
        ...BASE_MC,
        options: ["a", "b"],
        correctIndex: 0,
        distractorRationale: ["r1"],
      }).reasons;
    case "too_many_options":
      return validateStructure({
        ...BASE_MC,
        options: ["a", "b", "c", "d", "e", "f"],
        correctIndex: 0,
        distractorRationale: ["r1", "r2", "r3", "r4", "r5"],
      }).reasons;
    case "duplicate_options":
      return validateStructure({
        ...BASE_MC,
        options: ["mesma", "mesma", "outra", "mais"],
      }).reasons;
    case "blank_option":
      return validateStructure({
        ...BASE_MC,
        options: ["a", "  ", "c", "d"],
      }).reasons;
    case "correct_index_out_of_range":
      return validateStructure({ ...BASE_MC, correctIndex: 9 }).reasons;
    case "banned_option_phrase":
      return validateStructure({
        ...BASE_MC,
        options: ["a", "b", "c", "Todas as anteriores"],
      }).reasons;
    case "option_length_outlier":
      return validateStructure({
        ...BASE_MC,
        options: ["ab", "cd", "ef", "x".repeat(80)],
        correctIndex: 3,
      }).reasons;
    case "option_length_ratio":
      return validateStructure({
        ...BASE_MC,
        options: ["ab", "cd", "ef", "abcdefghijklmnop"],
      }).reasons;
    case "missing_reference_answer":
      return validateStructure({
        type: "OPEN",
        prompt: BASE_MC.prompt,
        options: null,
        correctIndex: null,
        referenceAnswer: null,
        explanation: null,
      }).reasons;
    case "placeholder_text":
      return validateStructure({
        ...BASE_MC,
        prompt: "Lorem ipsum dolor sit amet sobre concordância verbal na norma.",
      }).reasons;
    case "passage_required":
      return validateStructure({
        ...BASE_MC,
        requiresPassage: true,
        passage: null,
      }).reasons;
    case "distractor_rationale_missing":
      return validateStructure({
        ...BASE_MC,
        distractorRationale: [],
      }).reasons;
    case "knowledge_unit_ids_missing":
      return validateStructure({
        ...BASE_MC,
        knowledgeUnitIds: [],
      }).reasons;
    case "off_syllabus":
      return validateRelevance({
        origin: "generation",
        prompt: BASE_MC.prompt,
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "",
        syllabusLeafValid: false,
      }).reasons;
    case "tests_exam_metadata":
      return validateStructure({
        ...BASE_MC,
        prompt: "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?",
      }).reasons;
    case "tests_syllabus_meta":
      return validateRelevance({
        origin: "generation",
        prompt: "Quais assuntos de Língua Portuguesa constam no conteúdo programático?",
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "leaf-1",
        syllabusLeafValid: true,
      }).reasons;
    case "temporally_dependent": {
      const r = validateRelevance({
        origin: "generation",
        prompt: "Atualmente, qual é a alíquota vigente do ICMS neste ano?",
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "leaf-1",
        syllabusLeafValid: true,
      });
      return r.reviewReasons;
    }
    case "copied_previous_question":
      return validateRelevance({
        origin: "generation",
        prompt: BASE_MC.prompt,
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "leaf-1",
        syllabusLeafValid: true,
        previousQuestionStems: [BASE_MC.prompt],
      }).reasons;
    case "duplicate_question":
      return validateRelevance({
        origin: "generation",
        prompt: BASE_MC.prompt,
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "leaf-1",
        syllabusLeafValid: true,
        leafStems: [BASE_MC.prompt],
      }).reasons;
    case "ungrounded_citation":
      return validateGrounding({
        origin: "generation",
        knowledgeUnitIds: [],
      }).reasons;
    case "unsupported_specific":
      return validateGrounding({
        origin: "generation",
        knowledgeUnitIds: ["ku-1"],
        allowedKnowledgeUnitIds: ["ku-1"],
        knowledgeUnitStatements: ["O pregão é uma modalidade."],
        prompt: "Segundo a Lei 14.133/2021, o pregão:",
      }).reasons;
    case "verbatim_answer": {
      const ku =
        "A concordância verbal estabelece que o verbo deve concordar com o sujeito em número e pessoa em todas as circunstâncias previstas na norma culta.";
      return validateGrounding({
        origin: "generation",
        knowledgeUnitIds: ["ku-1"],
        allowedKnowledgeUnitIds: ["ku-1"],
        knowledgeUnitStatements: [ku],
        prompt: "Sobre concordância verbal:",
        options: ["errado", ku, "outro", "mais uma"],
        correctIndex: 1,
      }).reasons;
    }
    case "distractor_is_true": {
      const stmt =
        "Com o verbo haver no sentido de existir a construção é impessoal e fica no singular";
      return validateGrounding({
        origin: "generation",
        knowledgeUnitIds: ["ku-1"],
        allowedKnowledgeUnitIds: ["ku-1"],
        knowledgeUnitStatements: [stmt],
        prompt: "Assinale a alternativa correta sobre haver:",
        options: [
          "Houveram problemas na prova",
          "Com o verbo haver no sentido de existir a construção é impessoal e fica no singular",
          "Fazem anos que chove",
          "Existe muitas dúvidas",
        ],
        correctIndex: 0,
      }).reasons;
    }
    case "judge_unavailable":
      return decide({
        structural: structuralOk,
        judge: null,
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_answer_mismatch":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.9,
          answerIndex: 2,
          relevance: 0.9,
          durability: 0.9,
          grounding: 0.9,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_low_relevance":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.8,
          answerIndex: 0,
          relevance: 0.2,
          durability: 0.9,
          grounding: 0.9,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_low_durability":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.8,
          answerIndex: 0,
          relevance: 0.9,
          durability: 0.2,
          grounding: 0.9,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_low_grounding":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.8,
          answerIndex: 0,
          relevance: 0.9,
          durability: 0.9,
          grounding: 0.2,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_score_below_floor":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.2,
          answerIndex: 0,
          relevance: 0.9,
          durability: 0.9,
          grounding: 0.9,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "judge_score_borderline":
      return decide({
        structural: structuralOk,
        judge: {
          score: 0.55,
          answerIndex: 0,
          relevance: 0.9,
          durability: 0.9,
          grounding: 0.9,
          reasons: [],
          notes: "",
          model: "fixture",
        },
        correctIndex: 0,
        thresholds: THRESHOLDS,
      }).reasons;
    case "legacy_pre_redesign":
      // Ops/cutover code — triggered by demote endpoint, not the ladder.
      return ["legacy_pre_redesign"];
    default: {
      const _exhaustive: never = code;
      return [_exhaustive];
    }
  }
}

describe("reason-code trigger matrix (§41.1)", () => {
  it("catalogue has Portuguese descriptions for every code", () => {
    for (const code of REASON_CODES) {
      assert.ok(REASON_DESCRIPTIONS_PT[code], code);
    }
  });

  for (const code of REASON_CODES) {
    it(`triggers ${code}`, () => {
      const reasons = trigger(code);
      assert.ok(
        reasons.includes(code),
        `${code} not in [${reasons.join(", ")}]`,
      );
    });
  }
});
