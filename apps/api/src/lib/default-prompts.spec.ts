import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROMPTS } from "./default-prompts.js";

describe("prompt registry", () => {
  it("only ships the grading prompt", () => {
    // Generation, Eval and Extraction prompts belong to the content stack; a
    // stray key here means study is growing an LLM step it should not own.
    assert.deepEqual(Object.keys(DEFAULT_PROMPTS), ["quiz-correction"]);
  });
});

describe("quiz-correction default prompt", () => {
  const body = DEFAULT_PROMPTS["quiz-correction"];

  it("pins grading to the stored ground truth", () => {
    assert.match(body, /never invent answers/i);
    assert.match(body, /correctIndex/);
    assert.match(body, /referenceAnswer/);
    assert.match(body, /Do not change the correct answer/i);
  });

  it("specifies the JSON contract the corrector parses", () => {
    assert.match(body, /"answers"/);
    assert.match(body, /"generalComment"/);
    assert.match(body, /correctAnswerSummary/);
    assert.match(body, /JSON only/i);
  });

  it("keeps scoring binary and locale-aware", () => {
    assert.match(body, /grade 0 or 1/i);
    assert.match(body, /locale/i);
  });
});
