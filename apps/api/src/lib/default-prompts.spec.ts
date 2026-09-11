import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROMPTS } from "./default-prompts.js";

describe("question-generation default prompt", () => {
  const body = DEFAULT_PROMPTS["question-generation"];

  it("forbids process logistics and file-citation stems", () => {
    assert.match(body, /NEVER quiz process trivia/i);
    assert.match(body, /based on the provided file/i);
    assert.doesNotMatch(body, /ground questions in them/i);
  });

  it("defines open_exam subject-matter rules", () => {
    assert.match(body, /open_exam:/i);
    assert.doesNotMatch(body, /entrevista:/i);
    assert.match(body, /inferredSyllabus/);
    assert.match(body, /durationMinutes|mode "pill"/);
  });
});

describe("topic-inference default prompt", () => {
  const body = DEFAULT_PROMPTS["topic-inference"];

  it("builds a stable study plan from guidelines", () => {
    assert.match(body, /STABLE study plan/i);
    assert.match(body, /open_exam:/i);
    assert.doesNotMatch(body, /entrevista:/i);
    assert.match(body, /"subjects"/);
  });

  it("forbids treating ênfase/cargo vacancy names as subjects", () => {
    assert.match(body, /[Êê]nfase/);
    assert.match(body, /NOT study subjects/i);
    assert.match(body, /focusText/);
  });
});

describe("question-generation forbids edital logistics", () => {
  const body = DEFAULT_PROMPTS["question-generation"];

  it("explicitly bans organizadora, CLT, polos, and file-citation stems", () => {
    assert.match(body, /organizadora|Cesgranrio/i);
    assert.match(body, /\bCLT\b/);
    assert.match(body, /polos/i);
    assert.match(body, /based on the provided file/i);
  });
});
