import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isSessionDurationMinutes,
  questionBudgetForDuration,
  SESSION_DURATION_MINUTES,
} from "./types";
import { getTopicPreset, TOPIC_PRESETS, visibleTopicPresets } from "./presets";

describe("open_exam preset", () => {
  it("is the only product preset", () => {
    assert.equal(TOPIC_PRESETS.length, 1);
    assert.equal(TOPIC_PRESETS[0].slug, "open_exam");
    assert.equal(visibleTopicPresets().length, 1);
  });

  it("open_exam guidelines cover exam subjects without attachment prompts", () => {
    const p = getTopicPreset("open_exam")!;
    assert.match(p.guidelinesTemplate["pt"], /matérias/i);
    assert.match(p.guidelinesTemplate.en, /Subjects to practice/i);
    assert.doesNotMatch(p.guidelinesTemplate["pt"], /Anexe/i);
    assert.doesNotMatch(p.guidelinesTemplate.en, /Attach/i);
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
