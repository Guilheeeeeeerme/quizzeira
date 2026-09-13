// Concept: Golden paraphrase pairs exercise near-dup detection (§42).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { isQuestionNearDuplicateStem, tokenSetRatio } from "./fuzzy.js";

const PAIRS_PATH = resolve(__dirname, "../../../fixtures/golden/paraphrase-pairs.json");

interface PairFile {
  pairs: Array<{ id: string; nearDuplicate: boolean; a: string; b: string }>;
}

const file = JSON.parse(readFileSync(PAIRS_PATH, "utf8")) as PairFile;

describe("paraphrase-pairs.json (§42)", () => {
  it("covers 30 labelled pairs", () => {
    assert.equal(file.pairs.length, 30);
  });

  it("rejects every labelled hard-negative as near-duplicate", () => {
    for (const pair of file.pairs.filter((p) => !p.nearDuplicate)) {
      assert.equal(
        isQuestionNearDuplicateStem(pair.a, pair.b),
        false,
        `${pair.id}: false positive (ratio=${tokenSetRatio(pair.a, pair.b)})`,
      );
    }
  });

  it("scores labelled paraphrases above hard-negatives on average", () => {
    const pos = file.pairs.filter((p) => p.nearDuplicate);
    const neg = file.pairs.filter((p) => !p.nearDuplicate);
    assert.ok(pos.length >= 15);
    assert.ok(neg.length >= 8);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const posMean = mean(pos.map((p) => tokenSetRatio(p.a, p.b)));
    const negMean = mean(neg.map((p) => tokenSetRatio(p.a, p.b)));
    assert.ok(
      posMean > negMean + 10,
      `expected paraphrase mean (${posMean}) >> negative mean (${negMean})`,
    );
  });

  it("detects high-overlap paraphrases at the §26.3 threshold", () => {
    const tight = file.pairs.filter(
      (p) => p.nearDuplicate && tokenSetRatio(p.a, p.b) >= 85,
    );
    for (const pair of tight) {
      assert.equal(isQuestionNearDuplicateStem(pair.a, pair.b), true, pair.id);
    }
  });
});
