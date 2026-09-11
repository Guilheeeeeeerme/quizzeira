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

  it("reads common answer key notations", () => {
    const key = parseAnswerKey("01) A\n02 - C\n03. (E)");
    assert.equal(key.get(1), 0);
    assert.equal(key.get(2), 2);
    assert.equal(key.get(3), 4);
  });
});
