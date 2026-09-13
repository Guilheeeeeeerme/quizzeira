// Concept: Generation v2 LLM output schema (§24.4).

import { z } from "zod";
import type { GeneratedQuestionInput } from "../types";

export const generatedQuestionV2Schema = z.object({
  type: z.literal("MULTIPLE_CHOICE").default("MULTIPLE_CHOICE"),
  prompt: z.string().min(20),
  options: z.array(z.string().min(1)).min(2).max(5),
  correctIndex: z.number().int().nonnegative(),
  explanation: z.string().nullable().optional(),
  syllabusNodeId: z.string().min(1).optional(),
  knowledgeUnitIds: z.array(z.string().min(1)).min(1),
  distractorRationale: z.array(z.string().min(1)).min(1),
  passage: z.string().nullable().optional(),
  difficulty: z.number().min(0).max(1).optional(),
  bloom: z
    .enum(["remember", "understand", "apply", "analyze", "evaluate", "create"])
    .optional(),
});

export const generatedQuestionsV2ResponseSchema = z.object({
  questions: z.array(z.unknown()),
});

export type GeneratedQuestionV2 = z.infer<typeof generatedQuestionV2Schema>;

export type ParsedGenerationQuestion = GeneratedQuestionInput & {
  syllabusNodeId: string;
  knowledgeUnitIds: string[];
  distractorRationale: string[];
  passage: string | null;
  difficulty?: number;
  bloom?: string;
};

/**
 * Parse and filter LLM generation output. Invalid entries are dropped
 * (caller may retry the whole batch on empty result).
 */
export function parseGeneratedQuestionsV2(
  raw: unknown,
  syllabusNodeId: string,
  allowedKuIds: string[],
): ParsedGenerationQuestion[] {
  const allow = new Set(allowedKuIds);
  if (!Array.isArray(raw)) return [];
  const out: ParsedGenerationQuestion[] = [];

  for (const entry of raw) {
    const parsed = generatedQuestionV2Schema.safeParse(entry);
    if (!parsed.success) continue;
    const q = parsed.data;
    if (q.correctIndex < 0 || q.correctIndex >= q.options.length) continue;

    const fromModel = q.knowledgeUnitIds.map((id) => id.trim()).filter((id) => allow.has(id));
    const knowledgeUnitIds =
      fromModel.length > 0 ? fromModel : allowedKuIds.slice(0, Math.min(3, allowedKuIds.length));
    if (knowledgeUnitIds.length === 0) continue;
    if (q.distractorRationale.length < q.options.length - 1) continue;

    out.push({
      type: "MULTIPLE_CHOICE",
      prompt: q.prompt.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: q.correctIndex,
      referenceAnswer: null,
      explanation: q.explanation?.trim() || null,
      syllabusNodeId,
      knowledgeUnitIds,
      distractorRationale: q.distractorRationale.map((r) => r.trim()),
      passage: q.passage?.trim() || null,
      difficulty: q.difficulty,
      bloom: q.bloom,
    });
  }
  return out;
}
