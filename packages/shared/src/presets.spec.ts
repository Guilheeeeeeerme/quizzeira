import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSessionDurationMinutes,
  questionBudgetForDuration,
  SESSION_DURATION_MINUTES,
} from "./types";
import { getTopicPreset } from "./presets";

describe("open_exam and entrevista presets", () => {
  it("open_exam guidelines say docs are context for tested subjects", () => {
    const p = getTopicPreset("open_exam")!;
    assert.match(p.guidelinesTemplate["pt"], /CONTEXTO/);
    assert.match(p.guidelinesTemplate["pt"], /matérias/i);
    assert.match(p.guidelinesTemplate.en, /CONTEXT/);
  });

  it("entrevista guidelines emphasize skills practice not JD trivia", () => {
    const p = getTopicPreset("entrevista")!;
    assert.match(p.guidelinesTemplate["pt"], /CONTEXTO/);
    assert.match(p.guidelinesTemplate["pt"], /senioridade/i);
    assert.match(p.guidelinesTemplate.en, /seniority/i);
    assert.ok(p.focusExamples["pt"].includes("Perguntas técnicas da stack"));
  });
});

describe("session duration budgets", () => {
  it("defaults to pill bounds when duration missing", () => {
    assert.deepEqual(questionBudgetForDuration(null), {
      minQuestions: 3,
      maxQuestions: 6,
      mode: "pill",
    });
    assert.deepEqual(questionBudgetForDuration(undefined), {
      minQuestions: 3,
      maxQuestions: 6,
      mode: "pill",
    });
  });

  it("scales timed sessions and accepts only known durations", () => {
    assert.equal(SESSION_DURATION_MINUTES.length, 6);
    assert.ok(isSessionDurationMinutes(30));
    assert.equal(isSessionDurationMinutes(25), false);
    assert.equal(questionBudgetForDuration(15).mode, "timed");
    assert.ok(questionBudgetForDuration(90).maxQuestions > questionBudgetForDuration(15).maxQuestions);
  });
});
