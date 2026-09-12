import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import {
  isQuestionNearDuplicateStem,
  looksLikeListingTriviaStem,
  tokenSetRatio,
} from "@quizzeira/shared";
import { validateRelevance } from "../relevance.js";

interface RegressionItem {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  syllabusNodeId: string;
  knowledgeUnitIds: string[];
  origin: "generation";
}

interface RegressionFixture {
  items: RegressionItem[];
}

const FIXTURE_PATH = resolve(
  __dirname,
  "../../../../fixtures/golden/regression/listing-trivia/questions.json",
);

function loadFixture(): RegressionFixture {
  return JSON.parse(readFileSync(FIXTURE_PATH, "utf8")) as RegressionFixture;
}

test("REG-001..006 fail rung 2 with tests_exam_metadata and knowledge_unit_ids_missing", () => {
  const { items } = loadFixture();
  assert.equal(items.length, 6);

  for (const item of items) {
    const result = validateRelevance({
      origin: item.origin,
      prompt: item.prompt,
      options: item.options,
      knowledgeUnitIds: item.knowledgeUnitIds,
      syllabusNodeId: item.syllabusNodeId,
    });

    assert.equal(result.ok, false, `${item.id} should fail relevance`);
    assert.ok(
      result.reasons.includes("tests_exam_metadata"),
      `${item.id} should include tests_exam_metadata, got ${result.reasons.join(",")}`,
    );
    assert.ok(
      result.reasons.includes("knowledge_unit_ids_missing"),
      `${item.id} should include knowledge_unit_ids_missing, got ${result.reasons.join(",")}`,
    );
  }
});

test("§43.3 listing-trivia stems must not pass relevance even with fake KU ids", () => {
  const { items } = loadFixture();
  for (const item of items) {
    const result = validateRelevance({
      origin: "generation",
      prompt: item.prompt,
      options: item.options,
      knowledgeUnitIds: ["ku-fake-1", "ku-fake-2"],
      syllabusNodeId: item.syllabusNodeId || "leaf-fake",
    });
    assert.equal(result.ok, false, `${item.id} must still fail with KU ids present`);
    assert.ok(
      result.reasons.includes("tests_exam_metadata"),
      `${item.id} missing tests_exam_metadata`,
    );
  }
});

test("§43.2.3 listing-trivia stems match generation denylist", () => {
  const { items } = loadFixture();
  for (const item of items) {
    assert.ok(
      looksLikeListingTriviaStem(item.prompt),
      `${item.id} should match listing denylist: ${item.prompt}`,
    );
  }
});

test("REG-005 vs REG-002 are near-duplicate stems (tokenSetRatio ≥ 85)", () => {
  const { items } = loadFixture();
  const reg002 = items.find((i) => i.id === "REG-002");
  const reg005 = items.find((i) => i.id === "REG-005");
  assert.ok(reg002 && reg005);

  const ratio = tokenSetRatio(reg002.prompt, reg005.prompt);
  assert.ok(ratio >= 85, `expected ratio ≥ 85, got ${ratio}`);
  assert.ok(isQuestionNearDuplicateStem(reg002.prompt, reg005.prompt));
});
