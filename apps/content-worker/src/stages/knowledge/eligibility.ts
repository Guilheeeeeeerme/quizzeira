// Concept: Chunk eligibility ladder (§22.1).

import type { DocumentRole, EligibilityStatus, SectionRole } from "@quizzeira/shared";
import { isKnowledgeSectionRole, isGenerationEligibleRole } from "@quizzeira/shared";
import type { SectionScores } from "../scoring.js";
import type { KnowledgeChunkDraft } from "./chunker.js";

export interface EligibilityDecision {
  status: EligibilityStatus;
  reason: string;
  scores: SectionScores;
}

export interface EligibilityInput {
  documentRole: DocumentRole;
  sectionRole: SectionRole;
  language: string;
  chunk: KnowledgeChunkDraft;
  scores: SectionScores;
  isDuplicate: boolean;
  mapScore: number | null;
}

export function decideEligibility(input: EligibilityInput): EligibilityDecision {
  const { scores } = input;

  if (!isGenerationEligibleRole(input.documentRole)) {
    return { status: "ineligible", reason: "role", scores };
  }
  if (!isKnowledgeSectionRole(input.sectionRole)) {
    return { status: "ineligible", reason: "section_role", scores };
  }
  if (input.language !== "pt" && input.language !== "en") {
    return { status: "ineligible", reason: "language", scores };
  }
  if (scores.noise > 0.3) {
    return { status: "ineligible", reason: "noise", scores };
  }
  if (scores.metadataProbability > 0.35) {
    return { status: "ineligible", reason: "metadata", scores };
  }
  if (scores.sectionQuality < 0.45) {
    return { status: "ineligible", reason: "low_quality", scores };
  }
  if (input.chunk.text.length < 300 || input.chunk.text.length > 4000) {
    return { status: "ineligible", reason: "size", scores };
  }
  if (input.isDuplicate) {
    return { status: "ineligible", reason: "duplicate", scores };
  }
  if (input.mapScore == null || input.mapScore < 0.62) {
    return { status: "parked", reason: "unmapped", scores };
  }
  return { status: "eligible", reason: "ok", scores };
}
