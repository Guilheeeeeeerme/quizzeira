import assert from "node:assert/strict";
import { test } from "node:test";
import { decide } from "./gate";
import type { JudgeVerdict } from "./judge";
import type { StructuralResult } from "./structural";

const thresholds = { publish: 0.8, fail: 0.5 };
const structuralOk: StructuralResult = { ok: true, reasons: [], notes: "structural checks passed" };
const structuralBad: StructuralResult = {
  ok: false,
  reasons: ["duplicate_options"],
  notes: "alternativas duplicadas",
};

function judge(overrides: Partial<JudgeVerdict> = {}): JudgeVerdict {
  return { score: 0.9, answerIndex: 2, reasons: [], notes: "boa questão", model: null, ...overrides };
}

test("structural failure fails regardless of judge score", () => {
  const result = decide({
    structural: structuralBad,
    judge: judge({ score: 1 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.deepEqual(result.reasons, ["duplicate_options"]);
});

test("a missing judge parks the item for human review", () => {
  const result = decide({ structural: structuralOk, judge: null, correctIndex: 2, thresholds });
  assert.equal(result.decision, "needs_review");
  assert.ok(result.reasons.includes("judge_unavailable"));
});

test("extraction can publish without judge when the escape hatch is on", () => {
  const result = decide({
    structural: structuralOk,
    judge: null,
    correctIndex: 2,
    thresholds,
    publishExtractionWithoutJudge: true,
    origin: "extraction",
  });
  assert.equal(result.decision, "published");
  assert.ok(result.reasons.includes("extraction_without_judge"));
});

test("generation still needs a judge even with the extraction escape hatch", () => {
  const result = decide({
    structural: structuralOk,
    judge: null,
    correctIndex: 2,
    thresholds,
    publishExtractionWithoutJudge: true,
    origin: "generation",
  });
  assert.equal(result.decision, "needs_review");
});

test("a high-scoring item with judge agreement publishes", () => {
  const result = decide({ structural: structuralOk, judge: judge(), correctIndex: 2, thresholds });
  assert.equal(result.decision, "published");
  assert.equal(result.score, 0.9);
});

test("judge answering differently fails the item even with a high score", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.95, answerIndex: 1 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.ok(result.reasons.includes("judge_answer_mismatch"));
  assert.match(result.notes, /judge answered 1, item keys 2/);
});

test("a score below the floor fails", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.2 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.ok(result.reasons.includes("judge_score_below_floor"));
});

test("the middle band goes to HITL", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.65 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "needs_review");
  assert.ok(result.reasons.includes("judge_score_borderline"));
});

test("exactly at the publish threshold publishes", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.8 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "published");
});

test("open questions cannot mismatch on answer index", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ answerIndex: null }),
    correctIndex: null,
    thresholds,
  });
  assert.equal(result.decision, "published");
});

test("judge reasons are carried into the verdict", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.6, reasons: ["ambiguidade na alternativa B"] }),
    correctIndex: 2,
    thresholds,
  });
  assert.ok(result.reasons.includes("ambiguidade na alternativa B"));
});

test("relevance hard failure fails without a judge (rung 2 before rung 4)", () => {
  const result = decide({
    structural: structuralOk,
    relevance: {
      ok: false,
      reasons: ["tests_exam_metadata"],
      reviewReasons: [],
      notes: "metadata probability 0.9",
      metadataProbability: 0.9,
    },
    judge: judge({ score: 1 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.deepEqual(result.reasons, ["tests_exam_metadata"]);
});

test("relevance review reasons park an otherwise publishable item", () => {
  const relevance = {
    ok: true,
    reasons: [],
    reviewReasons: ["temporally_dependent" as const],
    notes: "answer may depend on a current year",
    metadataProbability: 0.1,
  };
  const withJudge = decide({ structural: structuralOk, relevance, judge: judge(), correctIndex: 2, thresholds });
  assert.equal(withJudge.decision, "needs_review");
  assert.ok(withJudge.reasons.includes("temporally_dependent"));
  const extraction = decide({
    structural: structuralOk,
    relevance,
    judge: null,
    correctIndex: 2,
    thresholds,
    publishExtractionWithoutJudge: true,
    origin: "extraction",
  });
  assert.equal(extraction.decision, "needs_review");
  const failing = decide({ structural: structuralOk, relevance, judge: judge({ score: 0.2 }), correctIndex: 2, thresholds });
  assert.equal(failing.decision, "failed");
});

test("a clean relevance result changes nothing", () => {
  const result = decide({
    structural: structuralOk,
    relevance: { ok: true, reasons: [], reviewReasons: [], notes: "relevance checks passed", metadataProbability: 0.05 },
    judge: judge(),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "published");
});
