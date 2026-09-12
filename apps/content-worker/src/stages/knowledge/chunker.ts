/** Section-aware chunker + eligibility (§22). */

import {
  ELIGIBILITY_THRESHOLDS,
  contentHash,
  roleAllowsKnowledgeIndex,
  type DocumentRole,
  type SectionRole,
} from "@quizzeira/shared";
import type { SectionScores } from "@quizzeira/shared";

export interface EligibleChunk {
  ordinal: number;
  text: string;
  sectionOrdinal: number;
  contentHash: string;
  eligibility: "eligible" | "ineligible" | "parked";
  eligibilityReason: string | null;
  scores: SectionScores;
}

export function chunkSections(
  sections: Array<{
    ordinal: number;
    text: string;
    role: SectionRole;
    scores: SectionScores;
  }>,
  documentRole: DocumentRole,
  opts: { targetChars?: number; maxChunks?: number } = {},
): EligibleChunk[] {
  const target = opts.targetChars ?? 1800;
  const maxChunks = opts.maxChunks ?? 200;
  const out: EligibleChunk[] = [];

  if (!roleAllowsKnowledgeIndex(documentRole) && documentRole !== "knowledge") {
    return [];
  }

  for (const section of sections) {
    if (section.role !== "content" && section.role !== "legal_article") {
      continue;
    }
    const pieces = packParagraphs(section.text, target);
    for (const piece of pieces) {
      if (out.length >= maxChunks) return out;
      const hash = contentHash(piece);
      let eligibility: EligibleChunk["eligibility"] = "eligible";
      let reason: string | null = null;
      const s = section.scores;

      if (s.metadataProbability > ELIGIBILITY_THRESHOLDS.metadataProbabilityMax) {
        eligibility = "ineligible";
        reason = "metadata";
      } else if (s.sectionQuality < ELIGIBILITY_THRESHOLDS.sectionQualityMin) {
        eligibility = "ineligible";
        reason = "low_quality";
      } else if (s.noise > ELIGIBILITY_THRESHOLDS.noiseMax) {
        eligibility = "ineligible";
        reason = "noise";
      } else if (
        piece.length < ELIGIBILITY_THRESHOLDS.charCountMin ||
        piece.length > ELIGIBILITY_THRESHOLDS.charCountMax
      ) {
        eligibility = "ineligible";
        reason = "size";
      }

      out.push({
        ordinal: out.length,
        text: piece,
        sectionOrdinal: section.ordinal,
        contentHash: hash,
        eligibility,
        eligibilityReason: reason,
        scores: s,
      });
    }
  }
  return out;
}

function packParagraphs(text: string, target: number): string[] {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return text.trim() ? [text.trim()] : [];
  const chunks: string[] = [];
  let buf = "";
  for (const p of paras) {
    if (!buf) {
      buf = p;
      continue;
    }
    if (buf.length + p.length + 2 <= target) {
      buf = `${buf}\n\n${p}`;
    } else {
      chunks.push(buf);
      buf = p;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
