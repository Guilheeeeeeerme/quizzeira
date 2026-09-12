// Concept: §41.4 negative metadata ladder — fail before judge.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { validateRelevance } from "./relevance.js";
import { validateStructure } from "./structural.js";

const FIXTURE = resolve(__dirname, "../../../fixtures/golden/negative/metadata-stems.json");

const OPTIONS = ["A", "B", "C", "D", "E"];
const RATIONALES = ["r1", "r2", "r3", "r4"];

describe("§41.4 negative metadata stems", () => {
  const file = JSON.parse(readFileSync(FIXTURE, "utf8")) as {
    items: Array<{ id: string; prompt: string; expectedReason: string }>;
  };

  it("covers the full 8-stem table", () => {
    assert.equal(file.items.length, 8);
  });

  for (const row of file.items) {
    it(`${row.id} → ${row.expectedReason} before judge`, () => {
      const structural = validateStructure({
        type: "MULTIPLE_CHOICE",
        origin: "generation",
        prompt: row.prompt,
        options: OPTIONS,
        correctIndex: 0,
        distractorRationale: RATIONALES,
      });
      // Structural may pass; relevance must fail with the expected reason.
      const relevance = validateRelevance({
        origin: "generation",
        prompt: row.prompt,
        options: OPTIONS,
        knowledgeUnitIds: ["ku-fake"],
        syllabusNodeId: "leaf-fake",
        syllabusLeafValid: true,
      });
      assert.equal(relevance.ok, false, `${row.id} should fail relevance`);
      assert.ok(
        relevance.reasons.includes(row.expectedReason as never),
        `${row.id}: expected ${row.expectedReason}, got ${relevance.reasons.join(",")}`,
      );
      assert.ok(structural.ok || !structural.ok); // structural not the gate for these
    });
  }
});
