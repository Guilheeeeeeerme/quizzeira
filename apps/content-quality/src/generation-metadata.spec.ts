// Concept: §43.2 — generation must not emit B1 exam-metadata stems.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { questionTestsExamMetadata } from "@quizzeira/shared";
import { validateRelevance } from "./relevance.js";

const LISTING_QUESTIONS = resolve(
  process.cwd(),
  "fixtures/golden/regression/listing-trivia/questions.json",
);
const GENERATION_PROMPT = resolve(
  process.cwd(),
  "apps/content-worker/src/generation/prompt.ts",
);

describe("generation metadata guard (§43.2)", () => {
  it("system prompt forbids B1–B4 metadata topics", () => {
    const src = readFileSync(GENERATION_PROMPT, "utf8");
    assert.match(src, /metadados do concurso/i);
    assert.match(src, /conte[uú]do program[aá]tico/i);
    assert.match(src, /navega[cç][aã]o de portal/i);
    assert.match(src, /instru[cç][oõ]es procedimentais/i);
  });

  it("rung 2 rejects every listing-trivia REG stem as exam metadata", () => {
    const file = JSON.parse(readFileSync(LISTING_QUESTIONS, "utf8")) as {
      items: Array<{ id: string; prompt: string }>;
    };
    const rows = file.items ?? [];
    assert.ok(rows.length >= 6);
    for (const row of rows) {
      assert.ok(
        questionTestsExamMetadata(row.prompt),
        `${row.id} should match METADATA_QUESTION_RE`,
      );
      const result = validateRelevance({
        origin: "generation",
        prompt: row.prompt,
        knowledgeUnitIds: ["ku-1"],
        syllabusNodeId: "leaf-1",
        syllabusLeafValid: true,
      });
      assert.equal(result.ok, false, row.id);
      assert.ok(result.reasons.includes("tests_exam_metadata"), row.id);
    }
  });
});
