import assert from "node:assert/strict";
import { test } from "node:test";
import { validateRelevance } from "./relevance.js";

test("copied_previous_question when stem near-duplicates a previous question", () => {
  const result = validateRelevance({
    origin: "generation",
    prompt: "Assinale a alternativa em que a concordância verbal está correta conforme a norma.",
    knowledgeUnitIds: ["ku-1"],
    syllabusNodeId: "leaf-1",
    previousQuestionStems: [
      "Assinale a alternativa em que a concordância verbal está correta conforme a norma padrão.",
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("copied_previous_question"));
});

test("duplicate_question when stem near-duplicates a leaf bank item", () => {
  const result = validateRelevance({
    origin: "generation",
    prompt: "Em licitações, a modalidade pregão é disciplinada principalmente pela Lei 14.133.",
    knowledgeUnitIds: ["ku-1"],
    syllabusNodeId: "leaf-1",
    leafStems: [
      "Em licitações, a modalidade pregão é disciplinada principalmente pela Lei nº 14.133/2021.",
    ],
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("duplicate_question"));
});
