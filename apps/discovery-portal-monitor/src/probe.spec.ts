import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isStale } from "./probe.js";

describe("isStale", () => {
  it("treats missing lastOkAt as stale", () => {
    assert.equal(isStale(null, 36), true);
    assert.equal(isStale(undefined, 36), true);
  });

  it("respects the stale window", () => {
    const now = Date.parse("2026-10-08T20:00:00Z");
    assert.equal(isStale("2026-10-08T10:00:00Z", 36, now), false);
    assert.equal(isStale("2026-10-06T20:00:00Z", 36, now), true);
  });
});
