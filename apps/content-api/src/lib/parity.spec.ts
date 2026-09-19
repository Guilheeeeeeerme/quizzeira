// Concept: canonical-bank dual-read parity check (§7, Next item 3).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findParityGaps } from "./parity";

describe("findParityGaps", () => {
  it("returns legacy ids not covered by the canonical mapping", () => {
    assert.deepEqual(findParityGaps(["a", "b", "c"], ["b", "c"]), ["a"]);
  });

  it("returns empty when canonical fully covers legacy (safe to drop the legacy path)", () => {
    assert.deepEqual(findParityGaps(["a", "b"], ["a", "b", "c"]), []);
  });

  it("returns everything when canonical has no coverage at all", () => {
    assert.deepEqual(findParityGaps(["a", "b"], []), ["a", "b"]);
  });

  it("is order-preserving over the legacy list", () => {
    assert.deepEqual(findParityGaps(["z", "y", "x"], ["y"]), ["z", "x"]);
  });
});
