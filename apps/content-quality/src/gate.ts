// Concept: Publish gate (turns structural + judge signals into one decision)
//
// Pure function on purpose: the decision rule is the most consequential logic
// in the pipeline, so it is testable without a model or a database.
import type { JudgeVerdict } from "./judge.js";
import type { StructuralResult } from "./structural.js";

export type GateDecision = "published" | "failed" | "needs_review";

export interface GateInput {
  structural: StructuralResult;
  /** Null when the judge could not run (no provider, budget hit, outage). */
  judge: JudgeVerdict | null;
  /** The item's own claimed answer, for agreement checking. */
  correctIndex: number | null;
  thresholds: GateThresholds;
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

  // Structural failures are deterministic and final; no model opinion can
  // rescue a malformed item.
  if (!structural.ok) {
    return {
      decision: "failed",
      score: 0,
      reasons: structural.reasons,
      notes: structural.notes,
    };
  }

  // Without a judge verdict we refuse to publish, but we also refuse to fail —
  // an infrastructure gap is not the item's fault, so a human decides.
  if (!judge) {
    return {
      decision: "needs_review",
      score: 0,
      reasons: ["judge_unavailable"],
      notes: "structural checks passed but LLM-as-judge did not run",
    };
  }

  const reasons = [...judge.reasons];

  // Disagreement on the keyed answer is the single strongest failure signal:
  // either the item is wrong or it is ambiguous. Both are disqualifying.
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

  // The middle band is exactly what HITL exists for.
  return {
    decision: "needs_review",
    score: judge.score,
    reasons: [...reasons, "judge_score_borderline"],
    notes: judge.notes,
  };
}
