// Concept: LLM-as-judge (model-scored review of an item that already passed
// structural validation)
//
// The judge scores, it does not rewrite. Its only output is a score plus
// reasons, which the publish gate turns into a decision. Keeping the judge
// unable to edit the item is what makes its verdict auditable.
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
}

export interface JudgeVerdict {
  /** 0..1 overall usability. */
  score: number;
  /** The judge's independent answer; a mismatch is a hard fail signal. */
  answerIndex: number | null;
  reasons: string[];
  notes: string;
  model: string | null;
}

export const JUDGE_SYSTEM_PROMPT = [
  "Você é um revisor técnico de itens de concurso público brasileiro.",
  "Avalie a questão apresentada com rigor e responda a questão de forma independente.",
  "Não reescreva a questão. Apenas avalie e pontue.",
  "Responda somente com JSON válido.",
].join(" ");

export const JUDGE_REQUIRED_KEYS = ["score", "reasons"] as const;

export function buildJudgePrompt(input: JudgeInput): string {
  const optionLines = (input.options ?? [])
    .map((o, i) => `${i}: ${o}`)
    .join("\n");

  return [
    `Concurso: ${input.examSlug}`,
    `Disciplina: ${input.subject}`,
    "",
    "Questão:",
    input.prompt,
    "",
    input.type === "MULTIPLE_CHOICE" ? `Alternativas:\n${optionLines}` : "Tipo: questão aberta",
    input.type === "MULTIPLE_CHOICE"
      ? `Alternativa indicada como correta: ${input.correctIndex}`
      : `Resposta de referência: ${input.referenceAnswer ?? "(ausente)"}`,
    input.explanation ? `Explicação fornecida: ${input.explanation}` : "",
    "",
    "Avalie:",
    "1. A questão é factualmente correta?",
    "2. Há exatamente uma alternativa defensável como correta?",
    "3. O enunciado é claro, autocontido e sem ambiguidade?",
    "4. A questão é adequada ao nível de um concurso público?",
    "",
    "Responda com JSON:",
    JSON.stringify(
      {
        score: 0.0,
        answerIndex: 0,
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

  // The judge's prose is model output like any other, so it is screened before
  // it can be persisted or shown in the admin queue (OWASP LLM10).
  screenModelStrings(notes, ...reasons);

  return { score, answerIndex, reasons, notes, model: null };
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
