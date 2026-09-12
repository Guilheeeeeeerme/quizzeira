import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extractMcqs, parseAnswerKey } from "./mcq.js";

const PROVA = `PROVA OBJETIVA

1 - Qual é a capital do Brasil?
a) São Paulo
b) Brasília
c) Rio de Janeiro
d) Salvador

2 - Quantos estados tem o Brasil?
a) 24
b) 25
c) 26
d) 27

GABARITO
1 - B
2 - D
`;

const BODY_ONLY = PROVA.split("GABARITO")[0];

describe("mcq extraction", () => {
  it("parses numbered questions and matches the answer key", () => {
    const items = extractMcqs(PROVA);
    assert.equal(items.length, 2);
    assert.equal(items[0].prompt, "Qual é a capital do Brasil?");
    assert.deepEqual(items[0].options, ["São Paulo", "Brasília", "Rio de Janeiro", "Salvador"]);
    assert.equal(items[0].correctIndex, 1);
    assert.equal(items[1].correctIndex, 3);
  });

  it("returns nothing when the answer key is missing", () => {
    assert.deepEqual(extractMcqs(BODY_ONLY), []);
  });

  it("accepts a key supplied by a separate gabarito document", () => {
    assert.equal(extractMcqs(BODY_ONLY, "1) B 2) D").length, 2);
  });

  it("ignores questions with fewer than four options", () => {
    const text = "1 - Pergunta?\na) um\nb) dois\n\nGABARITO\n1 - A\n";
    assert.deepEqual(extractMcqs(text), []);
  });

  it("parses mid-line option markers on a single paragraph", () => {
    const text = [
      "1 - Qual princípio?",
      "a) legalidade b) moralidade c) publicidade d) eficiência e) hierarquia",
      "",
      "GABARITO",
      "1 - A",
    ].join("\n");
    const items = extractMcqs(text);
    assert.equal(items.length, 1);
    assert.equal(items[0]!.correctIndex, 0);
    assert.equal(items[0]!.options.length, 5);
    assert.match(items[0]!.options[0]!, /legalidade/i);
  });
});
