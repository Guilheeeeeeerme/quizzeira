import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_PROMPTS } from "./default-prompts.js";

describe("question-generation default prompt", () => {
  const body = DEFAULT_PROMPTS["question-generation"];

  it("treats materials as context and forbids document meta-questions", () => {
    assert.match(body, /MATERIALS ARE CONTEXT/i);
    assert.match(body, /NEVER quiz document/i);
    assert.doesNotMatch(body, /ground questions in them/i);
  });

  it("defines open_exam and entrevista subject-matter rules", () => {
    assert.match(body, /open_exam:/i);
    assert.match(body, /entrevista:/i);
    assert.match(body, /inferredSyllabus/);
    assert.match(body, /durationMinutes|mode "pill"/);
    assert.match(body, /seniority|senioridade/i);
  });
});

describe("topic-inference default prompt", () => {
  const body = DEFAULT_PROMPTS["topic-inference"];

  it("builds a stable study plan from materials as context", () => {
    assert.match(body, /STABLE study plan/i);
    assert.match(body, /past exams/i);
    assert.match(body, /open_exam:/i);
    assert.match(body, /entrevista:/i);
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
