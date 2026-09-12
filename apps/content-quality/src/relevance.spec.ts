import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateRelevance } from "./relevance.js";

describe("relevance rung 2", () => {
  it("rejects vacancy metadata questions", () => {
    const result = validateRelevance({
      prompt: "Quantas vagas são oferecidas para o cargo de Analista?",
      options: ["10", "20", "30", "40", "50"],
      origin: "generation",
      syllabusNodeId: "leaf-1",
      knowledgeUnitIds: ["ku_1"],
    });
    assert.equal(result.ok, false);
    assert.ok(result.reasons.includes("tests_exam_metadata"));
  });

  it("requires knowledge unit ids for generation", () => {
    const result = validateRelevance({
      prompt: "Assinale a frase em que a concordância verbal está correta.",
      options: ["A", "B", "C", "D", "E"],
      origin: "generation",
      syllabusNodeId: "leaf-1",
      knowledgeUnitIds: [],
    });
    assert.ok(result.reasons.includes("knowledge_unit_ids_missing"));
  });
});
