// Concept: LLM-as-judge (model-scored review of an item that already passed
// structural + relevance + grounding rungs)
//
// The judge scores, it does not rewrite. V2 adds relevance / durability /
// grounding axes so metadata trivia cannot publish on a high overall score alone.
//
// Owner (JEV audit plan §4): JEV Score×4 + Choice `answerIndex`, staged by
// JEV_JUDGE_MODE. Reasons are code-mapped tags and notes come from a template:
// JEV never generates prose. `off` keeps the Gemini JSON judge; `shadow`
// decides with Gemini and logs JEV beside it; `active` decides with JEV only.
import { qualityEnv } from "./env.js";
import {
  generateJson,
  hasLlmProvider,
  jevDecide,
  jevModeFor,
  jevShadow,
  screenModelStrings,
  topChoice,
  type JevChoiceQuestion,
  type JevMode,
  type JevScoreQuestion,
  type LlmErrorCode,
} from "@quizzeira/worker-kit";

export interface JudgeInput {
  examSlug: string;
  subject: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  /** Syllabus leaf path for relevance scoring (§25.4). */
  syllabusPath?: string[] | null;
  /** Cited knowledge-unit statements (≤ ~1.5k tokens of context). */
  knowledgeUnitStatements?: string[] | null;
}

export interface JudgeVerdict {
  /** 0..1 overall usability. */
  score: number;
  /** The judge's independent answer; a mismatch is a hard fail signal. */
  answerIndex: number | null;
  /** 0..1 — is the item about the syllabus subtopic? */
  relevance: number | null;
  /** 0..1 — durable subject knowledge vs exam/admin metadata? */
  durability: number | null;
  /** 0..1 — keyed answer entailed by cited KUs? */
  grounding: number | null;
  reasons: string[];
  notes: string;
  model: string | null;
}

export interface JudgeDeps {
  generate?: typeof generateJson;
  jev?: typeof jevDecide;
  mode?: JevMode;
  hasProvider?: () => boolean;
  log?: { info: (m: string, f?: Record<string, unknown>) => void; warn: (m: string, f?: Record<string, unknown>) => void };
}

export const JUDGE_SYSTEM_PROMPT = [
  "Você é um revisor técnico de itens de concurso público brasileiro.",
  "Avalie a questão apresentada com rigor e responda a questão de forma independente.",
  "Não reescreva a questão. Apenas avalie e pontue.",
  "Rejeite itens que testem metadados do edital (vagas, cargos, taxas, bancas, cronogramas).",
  "Responda somente com JSON válido.",
].join(" ");

export const JUDGE_REQUIRED_KEYS = ["score", "reasons"] as const;
export const JUDGE_RUBRIC_VERSION = "judge-jev-v1";

/** Five ordered levels → `normalized` 0, .25, .5, .75, 1. */
const LEVELS = {
  score: [
    "Inutilizável: incorreta, ambígua ou sem alternativa defensável.",
    "Fraca: problemas sérios de correção ou clareza.",
    "Aceitável: correta, mas com imprecisões ou redação a melhorar.",
    "Boa: correta, clara e com exatamente uma alternativa defensável.",
    "Pronta para uso em concurso: correta, clara, autocontida e no nível adequado.",
  ],
  relevance: [
    "Não trata do subtópico indicado.",
    "Tangencia o subtópico.",
    "Parcialmente sobre o subtópico.",
    "Majoritariamente sobre o subtópico.",
    "Exatamente sobre o subtópico indicado.",
  ],
  durability: [
    "Testa metadados do concurso/portal (vagas, taxas, cronograma, navegação).",
    "Testa informação temporária ou trivia incidental.",
    "Mistura conhecimento da disciplina com detalhe circunstancial.",
    "Testa conhecimento da disciplina com dependência menor de contexto.",
    "Testa conhecimento durável da disciplina.",
  ],
  grounding: [
    "A resposta-chave contradiz ou ignora as unidades de conhecimento citadas.",
    "A resposta-chave é fracamente sustentada pelas unidades citadas.",
    "A resposta-chave é parcialmente sustentada.",
    "A resposta-chave é majoritariamente sustentada.",
    "A resposta-chave é diretamente sustentada pelas unidades citadas.",
  ],
} as const;

export type JudgeQuestions = {
  score: JevScoreQuestion;
  relevance: JevScoreQuestion;
  durability: JevScoreQuestion;
  grounding: JevScoreQuestion;
  answerIndex?: JevChoiceQuestion;
};

export function buildJudgeState(input: JudgeInput): unknown {
  return {
    rubric: JUDGE_RUBRIC_VERSION,
    exam: input.examSlug,
    syllabusPath: (input.syllabusPath ?? []).length ? input.syllabusPath : [input.subject],
    type: input.type,
    prompt: input.prompt,
    options: input.type === "MULTIPLE_CHOICE" ? (input.options ?? []).map((o, i) => ({ index: i, text: o })) : null,
    keyedIndex: input.type === "MULTIPLE_CHOICE" ? input.correctIndex : null,
    referenceAnswer: input.type === "OPEN" ? input.referenceAnswer : null,
    explanation: input.explanation,
    knowledgeUnits: (input.knowledgeUnitStatements ?? []).slice(0, 6),
  };
}

export function buildJudgeQuestions(input: JudgeInput): JudgeQuestions {
  const path = (input.syllabusPath ?? []).join(" ▸ ") || input.subject;
  const questions: JudgeQuestions = {
    score: {
      type: "score",
      instructions:
        "Qualidade geral da questão para uso em concurso público brasileiro: correção factual, exatamente uma alternativa defensável, enunciado claro e autocontido, nível adequado.",
      criteria: [...LEVELS.score],
    },
    relevance: {
      type: "score",
      instructions: `A questão é sobre o subtópico do conteúdo programático "${path}"?`,
      criteria: [...LEVELS.relevance],
    },
    durability: {
      type: "score",
      instructions:
        "A questão testa conhecimento durável da disciplina, e não metadados do edital, do portal, instruções processuais ou informação temporária (lista B1–B6)?",
      criteria: [...LEVELS.durability],
    },
    grounding: {
      type: "score",
      instructions:
        "A resposta-chave é sustentada pelas unidades de conhecimento citadas no estado?",
      criteria: [...LEVELS.grounding],
    },
  };
  if (input.type === "MULTIPLE_CHOICE" && (input.options ?? []).length >= 2) {
    const criteria: Record<string, string> = {};
    (input.options ?? []).forEach((o, i) => {
      criteria[String(i)] = o.slice(0, 300);
    });
    questions.answerIndex = {
      type: "choice",
      instructions:
        "Independentemente da alternativa indicada como correta, qual alternativa VOCÊ considera correta?",
      criteria,
    };
  }
  return questions;
}

export function buildJudgePrompt(input: JudgeInput): string {
  const optionLines = (input.options ?? [])
    .map((o, i) => `${i}: ${o}`)
    .join("\n");
  const path = (input.syllabusPath ?? []).join(" ▸ ") || input.subject;
  const kus = (input.knowledgeUnitStatements ?? []).slice(0, 6);

  return [
    `Concurso: ${input.examSlug}`,
    `Subtópico (syllabus): ${path}`,
    "",
    "Questão:",
    input.prompt,
    "",
    input.type === "MULTIPLE_CHOICE" ? `Alternativas:\n${optionLines}` : "Tipo: questão aberta",
    input.type === "MULTIPLE_CHOICE"
      ? `Alternativa indicada como correta: ${input.correctIndex}`
      : `Resposta de referência: ${input.referenceAnswer ?? "(ausente)"}`,
    input.explanation ? `Explicação fornecida: ${input.explanation}` : "",
    kus.length
      ? `\nUnidades de conhecimento citadas:\n${kus.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
      : "",
    "",
    "Avalie:",
    "1. A questão é factualmente correta?",
    "2. Há exatamente uma alternativa defensável como correta?",
    "3. O enunciado é claro, autocontido e sem ambiguidade?",
    "4. A questão é adequada ao nível de um concurso público?",
    "5. relevance (0-1): a questão é sobre o subtópico indicado?",
    "6. durability (0-1): testa conhecimento durável da disciplina (não metadados do edital/portal)?",
    "7. grounding (0-1): a resposta-chave é sustentada pelas unidades de conhecimento citadas?",
    "",
    "Lista B1–B6 (rejeitar durability baixa): metadados do concurso, meta do programa,",
    "navegação do portal, instruções processuais, trivia incidental, informação temporária.",
    "",
    "Responda com JSON:",
    JSON.stringify(
      {
        score: 0.0,
        answerIndex: 0,
        relevance: 0.0,
        durability: 0.0,
        grounding: 0.0,
        reasons: ["motivo curto", "outro motivo"],
        notes: "avaliação em uma ou duas frases",
      },
      null,
      2,
    ),
    "",
    "score: 0.0 (inutilizável) a 1.0 (pronta para uso).",
    "answerIndex: o índice que VOCÊ considera correto (null para questão aberta).",
  ]
    .filter(Boolean)
    .join("\n");
}

type ScoreLike = { normalized: number; confidence: number };
type ChoiceLike = { choice: string; probabilities: Record<string, number>; confidence: number };

/**
 * Validated JEV answers → verdict. Reasons are code tags, notes a fixed
 * template with the numbers — no model prose enters the publish record.
 */
export function verdictFromJev(
  answers: {
    score: ScoreLike;
    relevance: ScoreLike;
    durability: ScoreLike;
    grounding: ScoreLike;
    answerIndex?: ChoiceLike;
  },
  input: Pick<JudgeInput, "type" | "correctIndex">,
  model: string | null,
): JudgeVerdict {
  const score = clamp01(answers.score.normalized);
  const relevance = clamp01(answers.relevance.normalized);
  const durability = clamp01(answers.durability.normalized);
  const grounding = clamp01(answers.grounding.normalized);
  let answerIndex: number | null = null;
  if (input.type === "MULTIPLE_CHOICE" && answers.answerIndex) {
    const top = topChoice(answers.answerIndex.probabilities) ?? answers.answerIndex.choice;
    const parsed = Number(top);
    answerIndex = Number.isInteger(parsed) ? parsed : null;
  }
  const reasons = ["jev_scored"];
  if (score < 0.5) reasons.push("jev_low_overall");
  if (relevance < 0.5) reasons.push("jev_low_relevance");
  if (durability < 0.5) reasons.push("jev_low_durability");
  if (grounding < 0.5) reasons.push("jev_low_grounding");
  if (answerIndex != null && input.correctIndex != null && answerIndex !== input.correctIndex) {
    reasons.push("jev_answer_disagrees");
  }
  const fmt = (n: number) => n.toFixed(2);
  const notes =
    `JEV ${JUDGE_RUBRIC_VERSION}: score ${fmt(score)}, relevance ${fmt(relevance)}, ` +
    `durability ${fmt(durability)}, grounding ${fmt(grounding)}` +
    (answerIndex != null
      ? `, answerIndex ${answerIndex} (p=${fmt(answers.answerIndex?.probabilities[String(answerIndex)] ?? 0)})`
      : "") +
    `; confidence ${fmt(answers.score.confidence)}`;
  return { score, answerIndex, relevance, durability, grounding, reasons, notes, model };
}

export async function judgeItem(input: JudgeInput, deps: JudgeDeps = {}): Promise<JudgeVerdict> {
  const mode = deps.mode ?? jevModeFor("judge");
  const hasProvider = deps.hasProvider ?? hasLlmProvider;
  if (mode !== "active" && !hasProvider()) {
    throw Object.assign(new Error("llm_unavailable: no provider API key configured"), {
      code: "llm_unavailable" satisfies LlmErrorCode,
    });
  }
  const jev = deps.jev ?? jevDecide;
  const generate = deps.generate ?? generateJson;
  const state = buildJudgeState(input);
  const questions = buildJudgeQuestions(input);

  if (mode === "active") {
    // JEV owns scores + answerIndex. Errors propagate to the pipeline's
    // defer/backoff path — never a Gemini substitute for this decision.
    const decision = await jev({ task: "judge", state, questions, mode: "active" }, {});
    return verdictFromJev(decision.answers, input, decision.meta.returnedModel ?? decision.meta.requestedModel);
  }

  const productionPromise = generate<Record<string, unknown>>(
    JUDGE_SYSTEM_PROMPT,
    buildJudgePrompt(input),
    { temperature: 0, requiredKeys: JUDGE_REQUIRED_KEYS, tier: qualityEnv.judgeTier, stage: "judge" },
  ).then(normalizeJudgeResponse);

  if (mode === "shadow") {
    // Shadow never changes the production verdict; a Gemini failure still
    // propagates exactly as before once the shadow call has settled.
    const settled = await Promise.allSettled([
      productionPromise,
      jevShadow(
        { task: "judge", state, questions },
        (decision) => {
          const jevVerdict = verdictFromJev(decision.answers, input, null);
          return { rubric: JUDGE_RUBRIC_VERSION, jevScore: jevVerdict.score, jevAnswerIndex: jevVerdict.answerIndex, jevLowAxes: jevVerdict.reasons.filter((r) => r.startsWith("jev_low_")).length };
        },
        { decide: jev, ...(deps.log ? { log: deps.log } : {}) },
      ),
    ]);
    const production = settled[0];
    if (production.status === "rejected") throw production.reason;
    const shadow = settled[1].status === "fulfilled" ? settled[1].value : null;
    if (shadow) {
      const jevVerdict = verdictFromJev(shadow.answers, input, null);
      const log = deps.log ?? { info: () => {}, warn: () => {} };
      log.info("jev shadow vs gemini judge", {
        event: "jev_shadow_compare",
        task: "judge",
        rubric: JUDGE_RUBRIC_VERSION,
        geminiScore: production.value.score,
        jevScore: jevVerdict.score,
        scoreDelta: Number((jevVerdict.score - production.value.score).toFixed(3)),
        geminiAnswerIndex: production.value.answerIndex,
        jevAnswerIndex: jevVerdict.answerIndex,
        answerAgree: production.value.answerIndex === jevVerdict.answerIndex,
      });
    }
    return production.value;
  }
  return productionPromise;
}

export function normalizeJudgeResponse(raw: Record<string, unknown>): JudgeVerdict {
  const score = clamp01(Number(raw.score));
  const reasons = Array.isArray(raw.reasons)
    ? raw.reasons.map((r) => String(r).trim()).filter(Boolean).slice(0, 8)
    : [];
  const notes = typeof raw.notes === "string" ? raw.notes.trim().slice(0, 1000) : "";
  const answerIndex = Number.isInteger(Number(raw.answerIndex))
    ? Number(raw.answerIndex)
    : null;
  const relevance = optional01(raw.relevance);
  const durability = optional01(raw.durability);
  const grounding = optional01(raw.grounding);

  screenModelStrings(notes, ...reasons);

  return {
    score,
    answerIndex,
    relevance,
    durability,
    grounding,
    reasons,
    notes,
    model: null,
  };
}

function optional01(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return clamp01(n);
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
