// Concept: Chunk eligibility ladder (§22.1). A pure decision over the scores
// and roles a chunk carries; nothing is deleted, only labelled.
import type { DocumentRole, EligibilityStatus, IneligibilityReason, SectionRole } from "./roles";
import { isGenerationEligibleSection } from "./roles";
import { QUALITY_THRESHOLDS, type SectionScores } from "./scoring";

export interface EligibilityInput {
  documentRole: DocumentRole;
  sectionRole: SectionRole;
  language: string;
  scores: SectionScores;
  charCount: number;
  duplicateOfId?: string | null;
  mappedScore?: number | null;
  /** English is acceptable for IT subjects (§22.1). */
  allowEnglish?: boolean;
}

export interface EligibilityDecision {
  status: EligibilityStatus;
  reason: IneligibilityReason | null;
}

export function decideEligibility(input: EligibilityInput): EligibilityDecision {
  const t = QUALITY_THRESHOLDS;
  if (input.documentRole !== "knowledge") return { status: "ineligible", reason: "role" };
  if (!isGenerationEligibleSection(input.sectionRole)) return { status: "ineligible", reason: "section_role" };
  if (input.language !== "pt" && !(input.allowEnglish && input.language === "en")) {
    return { status: "ineligible", reason: "language" };
  }
  if (input.scores.noise > t.noiseMax) return { status: "ineligible", reason: "noise" };
  if (input.scores.metadataProbability > t.metadataProbabilityMax) {
    return { status: "ineligible", reason: "metadata" };
  }
  if (input.scores.sectionQuality < t.sectionQualityMin) return { status: "ineligible", reason: "low_quality" };
  if (input.charCount < t.chunkMinChars || input.charCount > t.chunkMaxChars) {
    return { status: "ineligible", reason: "size" };
  }
  if (input.duplicateOfId) return { status: "ineligible", reason: "duplicate" };
  if (input.mappedScore == null || input.mappedScore < t.mapAccept) {
    return { status: "parked", reason: "unmapped" };
  }
  return { status: "eligible", reason: null };
}
