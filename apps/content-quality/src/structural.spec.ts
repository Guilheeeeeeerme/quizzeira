import assert from "node:assert/strict";
import { test } from "node:test";
import { isLengthOutlier, isLengthRatioFail, validateStructure } from "./structural.js";

const valid = {
  type: "MULTIPLE_CHOICE" as const,
  prompt:
    "De acordo com a Lei 8.112/90, o prazo de estágio probatório do servidor público federal é de:",
  options: ["12 meses", "24 meses", "36 meses", "48 meses"],
  correctIndex: 2,
  referenceAnswer: null,
  explanation: "O estágio probatório é de 36 meses.",
};

test("a well-formed item passes", () => {
  const result = validateStructure(valid);
  assert.equal(result.ok, true);
  assert.deepEqual(result.reasons, []);
});

test("short prompts are rejected", () => {
  const result = validateStructure({ ...valid, prompt: "Qual?" });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("prompt_too_short"));
});

test("prompts referring to the source material are rejected", () => {
  const result = validateStructure({
    ...valid,
    prompt: "Segundo o trecho acima, qual é o prazo do estágio probatório do servidor federal?",
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("prompt_references_context"));
});

test("too few options is rejected", () => {
  const result = validateStructure({ ...valid, options: ["a", "b"], correctIndex: 0 });
  assert.ok(result.reasons.includes("too_few_options"));
});

test("duplicate options are rejected", () => {
  const result = validateStructure({
    ...valid,
    options: ["12 meses", "24 meses", "24 meses", "48 meses"],
  });
  assert.ok(result.reasons.includes("duplicate_options"));
});

test("an out-of-range correctIndex is rejected", () => {
  const result = validateStructure({ ...valid, correctIndex: 9 });
  assert.ok(result.reasons.includes("correct_index_out_of_range"));
});

test("a null correctIndex is rejected", () => {
  const result = validateStructure({ ...valid, correctIndex: null });
  assert.ok(result.reasons.includes("correct_index_out_of_range"));
});

test("'none of the above' style options are rejected", () => {
  const result = validateStructure({
    ...valid,
    options: ["12 meses", "24 meses", "36 meses", "Nenhuma das anteriores"],
  });
  assert.ok(result.reasons.includes("banned_option_phrase"));
});

test("blank options are rejected", () => {
  const result = validateStructure({ ...valid, options: ["12 meses", "  ", "36 meses", "48"] });
  assert.ok(result.reasons.includes("blank_option"));
});

test("open questions need a reference answer", () => {
  const openOk = validateStructure({
    type: "OPEN",
    prompt: "Explique o princípio da legalidade aplicado à administração pública brasileira.",
    options: null,
    correctIndex: null,
    referenceAnswer: "A administração só pode agir conforme previsão legal.",
    explanation: null,
  });
  assert.equal(openOk.ok, true);

  const openBad = validateStructure({
    type: "OPEN",
    prompt: "Explique o princípio da legalidade aplicado à administração pública brasileira.",
    options: null,
    correctIndex: null,
    referenceAnswer: "   ",
    explanation: null,
  });
  assert.ok(openBad.reasons.includes("missing_reference_answer"));
});

test("placeholder text is rejected", () => {
  const result = validateStructure({
    ...valid,
    prompt: "TODO escrever o enunciado desta questão sobre estágio probatório federal",
  });
  assert.ok(result.reasons.includes("placeholder_text"));
});

test("option_length_ratio fails when max/min > 2", () => {
  assert.equal(isLengthRatioFail(["ab", "abcdefghijklmnop", "cd", "ef"]), true);
  assert.equal(isLengthRatioFail(["12 meses", "24 meses", "36 meses", "48 meses"]), false);
});

test("a giveaway-length correct option is flagged", () => {
  assert.equal(isLengthOutlier(["a", "b", "c", "x".repeat(60)]), true);
  assert.equal(isLengthOutlier(["12 meses", "24 meses", "36 meses", "48 meses"]), false);
});

test("failure notes are human readable", () => {
  const result = validateStructure({ ...valid, prompt: "curto" });
  assert.match(result.notes, /caracteres/);
});
