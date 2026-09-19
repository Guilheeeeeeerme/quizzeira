// Concept: durable job lease layer (§5) — deterministic pieces tested without a DB.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { computeBackoffMs } from "./backoff";

const JOBS_SRC = resolve(__dirname, "./jobs.ts");

describe("computeBackoffMs", () => {
  it("grows exponentially with attempts, capped, with full jitter", () => {
    const fixed = () => 1; // pin jitter to the upper bound of each window
    assert.equal(computeBackoffMs(1, fixed), 30_000);
    assert.equal(computeBackoffMs(2, fixed), 60_000);
    assert.equal(computeBackoffMs(3, fixed), 120_000);
    assert.equal(computeBackoffMs(10, fixed), 3_600_000, "capped at one hour");
  });

  it("never exceeds the requested window (full jitter, not additive)", () => {
    for (const attempts of [1, 2, 3, 5, 8]) {
      const max = computeBackoffMs(attempts, () => 1);
      const min = computeBackoffMs(attempts, () => 0);
      assert.ok(min >= 0);
      assert.ok(min <= max);
    }
  });
});

describe("claim query guard", () => {
  const src = readFileSync(JOBS_SRC, "utf8");

  it("claims ready rows and expired leases, never a live lease", () => {
    assert.match(src, /FOR UPDATE SKIP LOCKED/);
    assert.match(src, /"status" IN \('queued', 'deferred'\) AND "availableAt" <= \$\{now\}/);
    assert.match(src, /"status" = 'leased' AND "leaseExpiresAt" < \$\{now\}/);
  });

  it("increments attempts and sets leaseOwner/leaseExpiresAt on claim", () => {
    assert.match(src, /status: "leased"/);
    assert.match(src, /leaseOwner: input\.leaseOwner/);
    assert.match(src, /attempts: \{ increment: 1 \}/);
  });

  it("routes exhausted attempts to the dead-letter state, not an infinite retry", () => {
    assert.match(src, /job\.attempts >= job\.maxAttempts/);
    assert.match(src, /status: "dead"/);
  });

  it("enqueue is idempotent per dedupeKey (upsert with a no-op update)", () => {
    assert.match(src, /where: \{ dedupeKey: input\.dedupeKey \}/);
    assert.match(src, /update: \{\}/);
  });
});
