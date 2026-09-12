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

  it("near paraphrases stay within maxDistance", () => {
    const a =
      "A concordância verbal exige que o verbo concorde com o sujeito em número e pessoa.";
    const b =
      "A concordância verbal requer que o verbo concorde com o sujeito em número e pessoa.";
    const dist = hammingDistance64(simhash64(a), simhash64(b));
    assert.ok(dist <= 8, `expected near-dup distance ≤8, got ${dist}`);
  });

  it("unrelated texts are not near-duplicates at threshold 3", () => {
    const a = "Princípios da Administração Pública: legalidade, impessoalidade, moralidade.";
    const b = "Sequências numéricas e progressões aritméticas no raciocínio lógico.";
    assert.equal(isNearDuplicateSimhash(a, b, 3), false);
  });
});
