// Concept: Invariants 3, 5, 6 — Eval publish gate (§9.4).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { REASON_CODES } from "@quizzeira/shared";
import { decide } from "./gate.js";
import type { JudgeVerdict } from "./judge.js";
import { validateGrounding } from "./grounding.js";

const thresholds = { publish: 0.8, fail: 0.5 };
const structuralOk = { ok: true, reasons: [] as string[], notes: "ok" };

function judge(overrides: Partial<JudgeVerdict> = {}): JudgeVerdict {
  return {
    score: 0.9,
    answerIndex: 2,
    relevance: 0.9,
    durability: 0.9,
    grounding: 0.9,
    reasons: [],
    notes: "ok",
    model: null,
    ...overrides,
  };
}

describe("invariants §9.4 (eval)", () => {
  it("invariant 3: generation without KU citations fails grounding", () => {
    const missing = validateGrounding({ origin: "generation", knowledgeUnitIds: [] });
    assert.equal(missing.ok, false);
    assert.ok(missing.reasons.includes("ungrounded_citation"));
    assert.equal(
      validateGrounding({ origin: "generation", knowledgeUnitIds: ["ku-1"] }).ok,
      true,
    );
  });

  it("invariant 3b: citations outside the brief subset fail grounding", () => {
    const result = validateGrounding({
      origin: "generation",
      knowledgeUnitIds: ["ku-1", "ku-rogue"],
      allowedKnowledgeUnitIds: ["ku-1"],
    });
    assert.equal(result.ok, false);
    assert.ok(result.reasons.includes("ungrounded_citation"));
  });

  it("invariant 5: published decision comes only from gate", () => {
    const result = decide({
      structural: structuralOk,
      relevance: { ok: true, reasons: [], reviewReasons: [], notes: "ok" },
      grounding: { ok: true, reasons: [], notes: "ok" },
      judge: judge(),
      correctIndex: 2,
      thresholds,
      origin: "generation",
    });
    assert.equal(result.decision, "published");
  });

  it("invariant 6: rejection reasons are machine-readable catalogue members", () => {
    const result = decide({
      structural: {
        ok: false,
        reasons: ["duplicate_options"],
        notes: "bad",
      },
      judge: null,
      correctIndex: 2,
      thresholds,
      origin: "generation",
    });
    assert.notEqual(result.decision, "published");
    assert.ok(result.reasons.length > 0);
    for (const reason of result.reasons) {
      assert.ok(
        (REASON_CODES as readonly string[]).includes(reason),
        `unknown reason ${reason}`,
      );
    }
  });
});
