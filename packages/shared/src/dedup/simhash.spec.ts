// Concept: SimHash near-duplicate unit tests (§26 / §41.1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hammingDistance64,
  isNearDuplicateSimhash,
  simhash64,
} from "./simhash.js";

describe("simhash64", () => {
  it("identical texts have Hamming distance 0", () => {
    const text =
      "A concordância verbal exige que o verbo concorde com o sujeito em número e pessoa.";
    assert.equal(hammingDistance64(simhash64(text), simhash64(text)), 0);
    assert.equal(isNearDuplicateSimhash(text, text), true);
  });

  it("normalization-equivalent documents have Hamming 0", () => {
    const a =
      "A concordância verbal exige que o verbo concorde com o sujeito em número e pessoa.";
    const b =
      "A  Concordância  Verbal  exige que o verbo concorde com o sujeito em número e pessoa!";
    assert.equal(hammingDistance64(simhash64(a), simhash64(b)), 0);
    assert.equal(isNearDuplicateSimhash(a, b, 3), true);
  });

  it("single-character OCR garble on long text stays within Hamming ≤3 (§26)", () => {
    const paragraph =
      "Quando o verbo haver significa existir, emprega-se na forma impessoal singular: havia muitas pessoas na sala de aula durante a prova objetiva do concurso publico federal brasileiro. ";
    const a = paragraph.repeat(2);
    const b = a.replace("pessoas", "pesssoas");
    const dist = hammingDistance64(simhash64(a), simhash64(b));
    assert.ok(dist <= 3, `expected OCR near-dup distance ≤3, got ${dist}`);
    assert.equal(isNearDuplicateSimhash(a, b, 3), true);
  });

  it("unrelated texts are not near-duplicates at threshold 3", () => {
    const a = "Princípios da Administração Pública: legalidade, impessoalidade, moralidade.";
    const b = "Sequências numéricas e progressões aritméticas no raciocínio lógico.";
    assert.equal(isNearDuplicateSimhash(a, b, 3), false);
  });
});
