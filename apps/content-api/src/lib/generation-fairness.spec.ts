// Concept: poison-leaf guard for the generation planner-queue (§9).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isLeafPoisoned } from "./generation-fairness";

describe("isLeafPoisoned", () => {
  it("is not poisoned with fewer runs than the threshold", () => {
    assert.equal(isLeafPoisoned(["failed", "failed"], 3), false);
  });

  it("is poisoned when the last `threshold` runs all failed", () => {
    assert.equal(isLeafPoisoned(["failed", "failed", "failed"], 3), true);
  });

  it("an ok result resets the streak (not poisoned)", () => {
    assert.equal(isLeafPoisoned(["failed", "failed", "ok", "failed", "failed"], 3), false);
  });

  it("a partial result also resets the streak", () => {
    assert.equal(isLeafPoisoned(["failed", "partial", "failed"], 3), false);
  });

  it("older history beyond the threshold window doesn't matter", () => {
    assert.equal(isLeafPoisoned(["failed", "failed", "failed", "ok", "ok"], 3), true);
  });
});
