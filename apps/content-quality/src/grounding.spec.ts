import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractSpecificValues,
  lexicalOverlap,
  validateGrounding,
} from "./grounding.js";

test("generation without citations fails ungrounded_citation", () => {
  const result = validateGrounding({ origin: "generation", knowledgeUnitIds: [] });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("ungrounded_citation"));
});

test("citations outside allowed brief set fail", () => {
  const result = validateGrounding({
    origin: "generation",
    knowledgeUnitIds: ["ku-x"],
    allowedKnowledgeUnitIds: ["ku-1", "ku-2"],
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("ungrounded_citation"));
});

test("unsupported specific value when Lei number missing from KUs", () => {
  const result = validateGrounding({
    origin: "generation",
    knowledgeUnitIds: ["ku-1"],
    allowedKnowledgeUnitIds: ["ku-1"],
    knowledgeUnitStatements: ["O pregão é uma modalidade de licitação."],
    prompt: "Segundo a Lei 14.133/2021, o pregão:",
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("unsupported_specific"));
});

test("verbatim long correct option fails", () => {
  const ku =
    "A concordância verbal estabelece que o verbo deve concordar com o sujeito em número e pessoa em todas as circunstâncias previstas na norma culta.";
  const result = validateGrounding({
    origin: "generation",
    knowledgeUnitIds: ["ku-1"],
    allowedKnowledgeUnitIds: ["ku-1"],
    knowledgeUnitStatements: [ku],
    prompt: "Sobre concordância:",
    options: [
      "errado",
      ku,
      "outro",
      "mais",
    ],
    correctIndex: 1,
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("verbatim_answer"));
});

test("high-overlap distractor fails distractor_is_true", () => {
  const stmt =
    "Com o verbo haver no sentido de existir a construção é impessoal e fica no singular";
  const result = validateGrounding({
    origin: "generation",
    knowledgeUnitIds: ["ku-1"],
    allowedKnowledgeUnitIds: ["ku-1"],
    knowledgeUnitStatements: [stmt],
    prompt: "Assinale a correta:",
    options: [
      "Houveram problemas na prova",
      "Com o verbo haver no sentido de existir a construção é impessoal e fica no singular",
      "Fazem anos que chove",
      "Existe muitas dúvidas",
    ],
    correctIndex: 0,
  });
  assert.equal(result.ok, false);
  assert.ok(result.reasons.includes("distractor_is_true"));
});

test("extractSpecificValues finds lei and art", () => {
  const values = extractSpecificValues("Conforme a Lei 14.133/2021 e o Art. 5º");
  assert.ok(values.some((v) => /14\.133/.test(v)));
  assert.ok(values.some((v) => /art/.test(v)));
});

test("lexicalOverlap is symmetric-ish", () => {
  assert.ok(lexicalOverlap("foo bar baz qux", "foo bar baz qux") >= 0.99);
  assert.ok(lexicalOverlap("alpha beta", "gamma delta") < 0.2);
});
