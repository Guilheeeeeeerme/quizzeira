/**
 * Rung 2 — syllabus & durability validation (§25.2).
 * Rejects listing-trivia / exam-metadata questions before the LLM judge.
 */
import {
  metadataProbability,
  temporallyDependent,
  testsSyllabusMeta,
  tokenSetRatio,
} from "@quizzeira/shared";

export type RelevanceReason =
  | "knowledge_unit_ids_missing"
  | "off_syllabus"
  | "tests_exam_metadata"
  | "tests_syllabus_meta"
  | "temporally_dependent"
  | "copied_previous_question"
  | "duplicate_question";

export interface RelevanceInput {
  prompt: string;
  options?: string[] | null;
  explanation?: string | null;
  origin?: string | null;
  syllabusNodeId?: string | null;
  knowledgeUnitIds?: string[] | null;
  /** Stems of previous questions in the same subject (copy check). */
  previousStems?: string[];
  /** Stems of existing items on the same leaf (near-dup). */
  existingStems?: string[];
  /** When true, require a non-null syllabusNodeId. */
  requireSyllabus?: boolean;
}

export interface RelevanceResult {
  ok: boolean;
  reasons: RelevanceReason[];
  notes: string;
  metadataProbability: number;
}

export function validateRelevance(input: RelevanceInput): RelevanceResult {
  const reasons: RelevanceReason[] = [];
  const blob = [input.prompt, ...(input.options ?? []), input.explanation ?? ""]
    .filter(Boolean)
    .join("\n");

  if (input.origin === "generation") {
    const kus = input.knowledgeUnitIds ?? [];
    if (kus.length === 0) reasons.push("knowledge_unit_ids_missing");
  }

  if (input.requireSyllabus !== false && input.origin === "generation" && !input.syllabusNodeId) {
    reasons.push("off_syllabus");
  }

  const meta = metadataProbability(blob);
  if (meta > 0.5) reasons.push("tests_exam_metadata");

  if (testsSyllabusMeta(blob)) reasons.push("tests_syllabus_meta");

  if (temporallyDependent(blob)) reasons.push("temporally_dependent");

  for (const stem of input.previousStems ?? []) {
    if (tokenSetRatio(input.prompt, stem) >= 85) {
      reasons.push("copied_previous_question");
      break;
    }
  }

  for (const stem of input.existingStems ?? []) {
    if (tokenSetRatio(input.prompt, stem) >= 85) {
      reasons.push("duplicate_question");
      break;
    }
  }

  // temporally_dependent parks in needs_review rather than hard-fail (§25.2)
  const hardFail = reasons.filter((r) => r !== "temporally_dependent");

  return {
    ok: hardFail.length === 0,
    reasons,
    notes: reasons.length ? reasons.join(",") : "relevance_ok",
    metadataProbability: meta,
  };
}
