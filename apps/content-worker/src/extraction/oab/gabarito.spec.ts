import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { answersInCanonicalOrder, parseGabaritoText } from "./gabarito";

const LETTERS = ["A", "B", "C", "D"];

/** One "1 2 … 20" / "C D C A …" band, as printed in the official key. */
function band(from: number, to: number, letterAt: (n: number) => string): string {
  const numbers: number[] = [];
  for (let n = from; n <= to; n += 1) numbers.push(n);
  return `${numbers.join(" ")}\n${numbers.map(letterAt).join(" ")}`;
}

function grid(type: number, letterAt: (n: number) => string): string {
  const bands: string[] = [`46º EXAME DE ORDEM - PROVA TIPO ${type}`];
  for (let from = 1; from <= 80; from += 20) bands.push(band(from, from + 19, letterAt));
  return bands.join("\n");
}

describe("parseGabaritoText", () => {
  it("reads one answer grid per booklet type", () => {
    const text = [1, 2, 3, 4]
      .map((type) => grid(type, (n) => LETTERS[(n + type) % 4]))
      .join("\n");
    const result = parseGabaritoText(text);
    assert.equal(result.answersByType.size, 4);
    assert.equal(result.answersByType.get(1)?.size, 80);
    assert.equal(result.answersByType.get(1)?.get(1), (1 + 1) % 4);
    assert.equal(result.answersByType.get(4)?.get(80), (80 + 4) % 4);
  });

  it("flags a definitive key", () => {
    assert.equal(parseGabaritoText("Gabaritos definitivos da prova objetiva").definitive, true);
    assert.equal(parseGabaritoText("Gabaritos preliminares").definitive, false);
  });

  it("reads the correspondence table printed two entries wide", () => {
    const text = [
      grid(1, () => "A"),
      "TABELA DE CORRESPONDÊNCIA DE QUESTÕES",
      "TIPO 1 TIPO 2 TIPO 3 TIPO 4",
      "1 11 21 31 2 12 22 32",
      "3 13 23 33",
    ].join("\n");
    const result = parseGabaritoText(text);
    assert.equal(result.correspondence.size, 3);
    assert.equal(result.correspondence.get(2)?.get(3), 22);
    assert.equal(result.correspondence.get(3)?.get(4), 33);
  });

  it("tolerates an edition that omits the correspondence table", () => {
    const result = parseGabaritoText(grid(1, () => "B"));
    assert.equal(result.correspondence.size, 0);
    assert.equal(result.answersByType.get(1)?.size, 80);
  });
});

describe("answersInCanonicalOrder", () => {
  it("returns Tipo 1 unchanged", () => {
    const result = parseGabaritoText(grid(1, (n) => LETTERS[n % 4]));
    const canonical = answersInCanonicalOrder(result, 1);
    assert.equal(canonical?.get(5), 5 % 4);
  });

  it("re-keys another booklet type through the correspondence table", () => {
    // Tipo 1 question 1 is printed as question 11 in Tipo 2, where the key says D.
    const text = [
      grid(2, (n) => (n === 11 ? "D" : "A")),
      "TABELA DE CORRESPONDÊNCIA DE QUESTÕES",
      "1 11 21 31",
    ].join("\n");
    const canonical = answersInCanonicalOrder(parseGabaritoText(text), 2);
    assert.equal(canonical?.get(1), 3);
  });

  it("refuses to guess when the correspondence table is missing", () => {
    const result = parseGabaritoText(grid(3, () => "A"));
    assert.equal(answersInCanonicalOrder(result, 3), null);
  });

  it("returns null for a booklet type the key does not cover", () => {
    const result = parseGabaritoText(grid(1, () => "A"));
    assert.equal(answersInCanonicalOrder(result, 4), null);
  });
});
