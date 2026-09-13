// Concept: parseGeneratedQuestionsV2 (§24.4).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGeneratedQuestionsV2 } from "./generation-output.js";

describe("parseGeneratedQuestionsV2", () => {
  it("accepts a well-formed question with difficulty and bloom", () => {
    const out = parseGeneratedQuestionsV2(
      [
        {
          type: "MULTIPLE_CHOICE",
          prompt: "Assinale a alternativa correta sobre concordância verbal na norma-padrão.",
          options: ["a", "b", "c", "d", "e"],
          correctIndex: 1,
          explanation: "porque",
          knowledgeUnitIds: ["ku-1"],
          distractorRationale: ["r1", "r2", "r3", "r4"],
          passage: null,
          difficulty: 0.5,
          bloom: "apply",
        },
      ],
      "leaf-1",
      ["ku-1", "ku-2"],
    );
    assert.equal(out.length, 1);
    assert.equal(out[0]?.difficulty, 0.5);
    assert.equal(out[0]?.bloom, "apply");
    assert.equal(out[0]?.syllabusNodeId, "leaf-1");
  });

  it("drops entries missing distractor rationales", () => {
    const out = parseGeneratedQuestionsV2(
      [
        {
          type: "MULTIPLE_CHOICE",
          prompt: "Assinale a alternativa correta sobre concordância verbal na norma-padrão.",
          options: ["a", "b", "c", "d"],
          correctIndex: 0,
          knowledgeUnitIds: ["ku-1"],
          distractorRationale: ["only-one"],
        },
      ],
      "leaf-1",
      ["ku-1"],
    );
    assert.equal(out.length, 0);
  });
});
