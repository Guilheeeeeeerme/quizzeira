import assert from "node:assert/strict";
import { test } from "node:test";
import { computeStyleProfile } from "./style-profile.js";

test("computeStyleProfile aggregates option count and openers", () => {
  const profile = computeStyleProfile([
    {
      prompt: "Assinale a alternativa correta sobre concordância.",
      options: ["a", "b", "c", "d", "e"],
    },
    {
      prompt: "Assinale a opção em que há erro.",
      options: ["a", "b", "c", "d", "e"],
    },
    {
      prompt: "De acordo com a norma-padrão, indique a forma adequada.",
      options: ["a", "b", "c", "d", "e"],
    },
  ]);
  assert.equal(profile.optionCount, 5);
  assert.equal(profile.sampleSize, 3);
  assert.ok(profile.commandVerbs.includes("Assinale"));
  assert.ok(profile.stemLengthP50 > 0);
});

test("empty samples return defaults", () => {
  const profile = computeStyleProfile([]);
  assert.equal(profile.optionCount, 5);
  assert.equal(profile.sampleSize, 0);
});
