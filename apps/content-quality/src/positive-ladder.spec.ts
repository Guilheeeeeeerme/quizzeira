// Concept: §41.5 positive ladder — POS items pass rungs 1–3, then decide()→published.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { validateGrounding } from "./grounding.js";
import { decide } from "./gate.js";
import { validateRelevance } from "./relevance.js";
import { validateStructure } from "./structural.js";

const FIXTURE = resolve(__dirname, "../../../fixtures/golden/positive/pos-items.json");

interface PosItem {
  id: string;
  syllabusNodeId: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  distractorRationale: string[];
  knowledgeUnitIds: string[];
  knowledgeUnitStatements: string[];
  requiresPassage?: boolean;
  passage?: string;
}

describe("§41.5 positive ladder POS-001..005", () => {
  const file = JSON.parse(readFileSync(FIXTURE, "utf8")) as { items: PosItem[] };

  it("covers POS-001..005", () => {
    assert.equal(file.items.length, 5);
    assert.deepEqual(
      file.items.map((i) => i.id),
      ["POS-001", "POS-002", "POS-003", "POS-004", "POS-005"],
    );
  });

  for (const item of file.items) {
    it(`${item.id} rungs 1–3 + fixture judge → published`, () => {
      const structural = validateStructure({
        type: "MULTIPLE_CHOICE",
        origin: "generation",
        prompt: item.prompt,
        options: item.options,
        correctIndex: item.correctIndex,
        explanation: item.explanation ?? null,
        distractorRationale: item.distractorRationale,
        requiresPassage: item.requiresPassage ?? false,
        passage: item.passage ?? null,
        knowledgeUnitIds: item.knowledgeUnitIds,
      });
      assert.equal(structural.ok, true, `${item.id} structural: ${structural.reasons.join(",")}`);

      const relevance = validateRelevance({
        origin: "generation",
        prompt: item.prompt,
        options: item.options,
        explanation: item.explanation,
        knowledgeUnitIds: item.knowledgeUnitIds,
        syllabusNodeId: item.syllabusNodeId,
        syllabusLeafValid: true,
      });
      assert.equal(relevance.ok, true, `${item.id} relevance: ${relevance.reasons.join(",")}`);

      const grounding = validateGrounding({
        origin: "generation",
        prompt: item.prompt,
        options: item.options,
        correctIndex: item.correctIndex,
        knowledgeUnitIds: item.knowledgeUnitIds,
        allowedKnowledgeUnitIds: item.knowledgeUnitIds,
        knowledgeUnitStatements: item.knowledgeUnitStatements,
      });
      assert.equal(grounding.ok, true, `${item.id} grounding: ${grounding.reasons.join(",")}`);

      // Fixture-judge path (§41.5): canned judge scores + agreement → published.
      const gate = decide({
        structural,
        relevance,
        grounding,
        judge: {
          score: 0.9,
          answerIndex: item.correctIndex,
          relevance: 0.9,
          durability: 0.9,
          grounding: 0.9,
          reasons: [],
          notes: "fixture judge",
          model: "fixture",
        },
        correctIndex: item.correctIndex,
        thresholds: { publish: 0.75, fail: 0.4 },
        origin: "generation",
      });
      assert.equal(gate.decision, "published", `${item.id} gate: ${gate.reasons.join(",")}`);
    });
  }
});
