// Concept: MinHash Jaccard estimate unit tests (§26 / §41.1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  estimateJaccard,
  isNearDuplicateMinhash,
  minhashSignature,
} from "./minhash.js";

function trueJaccard(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const tb = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  const union = new Set([...ta, ...tb]).size;
  return union === 0 ? 0 : inter / union;
}

describe("minhashSignature", () => {
  it("estimates Jaccard within ±0.05 on high-overlap pairs", () => {
    const base =
      "concordancia verbal sujeito verbo numero pessoa regra geral composto anteposto";
    const near =
      "concordancia verbal sujeito verbo numero pessoa regra geral composto posposto";
    const estimated = estimateJaccard(minhashSignature(base), minhashSignature(near));
    const actual = trueJaccard(base, near);
    assert.ok(
      Math.abs(estimated - actual) <= 0.05,
      `estimate ${estimated} vs actual ${actual}`,
    );
    assert.equal(isNearDuplicateMinhash(base, near, 0.7), true);
  });

  it("low-overlap pairs stay below 0.85 threshold", () => {
    const a = "licitacao pregão eletronico proposta vantajosa isonomia";
    const b = "ortografia oficial acentuacao grafia novo acordo";
    assert.equal(isNearDuplicateMinhash(a, b, 0.85), false);
  });
});
