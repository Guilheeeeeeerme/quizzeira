// Concept: LLM-as-judge (model-scored review of an item that already passed
// structural + relevance + grounding rungs)
//
// The judge scores, it does not rewrite. V2 adds relevance / durability /
// grounding axes so metadata trivia cannot publish on a high overall score alone.
import {
  generateJson,
  hasLlmProvider,
  screenModelStrings,
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

export const JUDGE_SYSTEM_PROMPT = [
  "Você é um revisor técnico de itens de concurso público brasileiro.",
  "Avalie a questão apresentada com rigor e responda a questão de forma independente.",
  "Não reescreva a questão. Apenas avalie e pontue.",
  "Rejeite itens que testem metadados do edital (vagas, cargos, taxas, bancas, cronogramas).",
  "Responda somente com JSON válido.",
].join(" ");

export const JUDGE_REQUIRED_KEYS = ["score", "reasons"] as const;

export function buildJudgePrompt(input: JudgeInput): string {
  const optionLines = (input.options ?? [])
    .map((o, i) => `${i}: ${o}`)
    .join("\n");
  const path = (input.syllabusPath ?? []).join(" ▸ ") || input.subject;
  const kus = (input.knowledgeUnitStatements ?? []).slice(0, 8);

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

export async function judgeItem(input: JudgeInput): Promise<JudgeVerdict> {
  if (!hasLlmProvider()) {
    throw Object.assign(new Error("llm_unavailable: no provider API key configured"), {
      code: "llm_unavailable" satisfies LlmErrorCode,
    });
  }

  const raw = await generateJson<Record<string, unknown>>(
    JUDGE_SYSTEM_PROMPT,
    buildJudgePrompt(input),
    { temperature: 0, requiredKeys: JUDGE_REQUIRED_KEYS },
  );

  return normalizeJudgeResponse(raw);
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
