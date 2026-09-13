import assert from "node:assert/strict";
import { test } from "node:test";
import { decide } from "./gate.js";
import type { JudgeVerdict } from "./judge.js";
import type { StructuralResult } from "./structural.js";

const thresholds = { publish: 0.8, fail: 0.5 };
const structuralOk: StructuralResult = { ok: true, reasons: [], notes: "structural checks passed" };
const structuralBad: StructuralResult = {
  ok: false,
  reasons: ["duplicate_options"],
  notes: "alternativas duplicadas",
};

function judge(overrides: Partial<JudgeVerdict> = {}): JudgeVerdict {
  return {
    score: 0.9,
    answerIndex: 2,
    relevance: 0.9,
    durability: 0.9,
    grounding: 0.9,
    reasons: [],
    notes: "boa questão",
    model: null,
    ...overrides,
  };
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

test("transcription can publish without judge when the escape hatch is on", () => {
  const result = decide({
    structural: structuralOk,
    judge: null,
    correctIndex: 2,
    thresholds,
    publishExtractionWithoutJudge: true,
    origin: "transcription",
  });
  assert.equal(result.decision, "published");
});

test("relevance hard failures fail before the judge", () => {
  const result = decide({
    structural: structuralOk,
    relevance: {
      ok: false,
      reasons: ["tests_exam_metadata", "knowledge_unit_ids_missing"],
      reviewReasons: [],
      notes: "metadata",
    },
    grounding: null,
    judge: null,
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.ok(result.reasons.includes("tests_exam_metadata"));
});

test("grounding hard failures fail before the judge", () => {
  const result = decide({
    structural: structuralOk,
    relevance: { ok: true, reasons: [], reviewReasons: [], notes: "ok" },
    grounding: { ok: false, reasons: ["ungrounded_citation"], notes: "no citations" },
    judge: null,
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.ok(result.reasons.includes("ungrounded_citation"));
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

test("judge low durability hard-fails even with a high score", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.95, durability: 0.2 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "failed");
  assert.ok(result.reasons.includes("judge_low_durability"));
});

test("judge low grounding parks for review", () => {
  const result = decide({
    structural: structuralOk,
    judge: judge({ score: 0.95, grounding: 0.2 }),
    correctIndex: 2,
    thresholds,
  });
  assert.equal(result.decision, "needs_review");
  assert.ok(result.reasons.includes("judge_low_grounding"));
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
