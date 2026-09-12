// Concept: Publish gate (turns structural + relevance + grounding + judge into one decision)
import type { JudgeVerdict } from "./judge.js";
import type { StructuralResult } from "./structural.js";
import type { RelevanceResult } from "./relevance.js";
import type { GroundingResult } from "./grounding.js";

export type GateDecision = "published" | "failed" | "needs_review";

export interface GateInput {
  structural: StructuralResult;
  relevance?: RelevanceResult | null;
  grounding?: GroundingResult | null;
  /** Null when the judge could not run (no provider, budget hit, outage). */
  judge: JudgeVerdict | null;
  /** The item's own claimed answer, for agreement checking. */
  correctIndex: number | null;
  thresholds: GateThresholds;
  /**
   * When true and judge is null, structurally-ok extraction items publish
   * instead of parking in needs_review (Headroom/provider outage escape hatch).
   */
  publishExtractionWithoutJudge?: boolean;
  origin?: "extraction" | "generation" | "transcription" | string | null;
}

export interface GateThresholds {
  /** At or above this score, and with judge agreement, the item publishes. */
  publish: number;
  /** Below this score the item fails outright. */
  fail: number;
}

export interface GateResult {
  decision: GateDecision;
  score: number;
  reasons: string[];
  notes: string;
}

export function decide(input: GateInput): GateResult {
  const { structural, judge, thresholds } = input;

  if (!structural.ok) {
    return {
      decision: "failed",
      score: 0,
      reasons: structural.reasons,
      notes: structural.notes,
    };
  }

  if (input.relevance && !input.relevance.ok) {
    const softOnly =
      input.relevance.reasons.length > 0 &&
      input.relevance.reasons.every((r) => r === "temporally_dependent");
    if (softOnly) {
      return {
        decision: "needs_review",
        score: 0.4,
        reasons: input.relevance.reasons,
        notes: input.relevance.notes,
      };
    }
    return {
      decision: "failed",
      score: 0,
      reasons: input.relevance.reasons,
      notes: input.relevance.notes,
    };
  }

  if (input.grounding && !input.grounding.ok) {
    return {
      decision: "failed",
      score: 0,
      reasons: input.grounding.reasons,
      notes: input.grounding.notes,
    };
  }

  if (!judge) {
    if (
      input.publishExtractionWithoutJudge &&
      (input.origin === "extraction" || input.origin === "transcription")
    ) {
      return {
        decision: "published",
        score: 1,
        reasons: ["structural_ok", "extraction_without_judge"],
        notes: "published from past-exam extraction; LLM judge unavailable",
      };
    }
    return {
      decision: "needs_review",
      score: 0,
      reasons: ["judge_unavailable"],
      notes: "structural checks passed but LLM-as-judge did not run",
    };
  }

  const reasons = [...judge.reasons];

  const disagrees =
    input.correctIndex != null &&
    judge.answerIndex != null &&
    judge.answerIndex !== input.correctIndex;

  if (disagrees) {
    return {
      decision: "failed",
      score: judge.score,
      reasons: [...reasons, "judge_answer_mismatch"],
      notes:
        `judge answered ${judge.answerIndex}, item keys ${input.correctIndex}` +
        (judge.notes ? ` — ${judge.notes}` : ""),
    };
  }

  if (judge.score >= thresholds.publish) {
    return { decision: "published", score: judge.score, reasons, notes: judge.notes };
  }

  if (judge.score < thresholds.fail) {
    return {
      decision: "failed",
      score: judge.score,
      reasons: [...reasons, "judge_score_below_floor"],
      notes: judge.notes,
    };
  }

  return {
    decision: "needs_review",
    score: judge.score,
    reasons: [...reasons, "judge_score_borderline"],
    notes: judge.notes,
  };
}
