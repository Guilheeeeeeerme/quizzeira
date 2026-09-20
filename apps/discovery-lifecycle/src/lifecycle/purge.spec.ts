import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computePurgeEligibleAt,
  decidePurge,
  DEFAULT_PURGE_POLICY,
} from "./purge.js";

describe("purge policy", () => {
  it("computes soft-archive eligibility from examDate", () => {
    const examDate = new Date("2020-01-01T00:00:00Z");
    const eligible = computePurgeEligibleAt(examDate);
    assert.equal(
      eligible.getTime(),
      examDate.getTime() + DEFAULT_PURGE_POLICY.softArchiveGraceDays * 86_400_000,
    );
  });

  it("marks past_due when exam date passed", () => {
    const d = decidePurge({
      phase: "registration_closed",
      examDate: new Date("2020-01-01"),
      archivedAt: null,
      purgeEligibleAt: null,
      now: new Date("2020-02-01"),
    });
    assert.equal(d.action, "mark_past_due");
    assert.equal(d.deleteArtifacts, false);
  });

  it("soft-archives after grace", () => {
    const d = decidePurge({
      phase: "past_due",
      examDate: new Date("2020-01-01"),
      archivedAt: null,
      purgeEligibleAt: new Date("2020-01-31"),
      now: new Date("2020-02-01"),
    });
    assert.equal(d.action, "soft_archive");
  });

  it("hard-deletes Discovery artifacts only after hard grace", () => {
    const archivedAt = new Date("2020-01-01T00:00:00Z");
    const tooSoon = decidePurge({
      phase: "archived",
      examDate: new Date("2019-12-01"),
      archivedAt,
      purgeEligibleAt: archivedAt,
      now: new Date("2020-02-01"),
    });
    assert.equal(tooSoon.action, "none");

    const ready = decidePurge({
      phase: "archived",
      examDate: new Date("2019-12-01"),
      archivedAt,
      purgeEligibleAt: archivedAt,
      now: new Date("2020-05-01"),
    });
    assert.equal(ready.action, "hard_delete_discovery");
    assert.equal(ready.deleteArtifacts, true);
    assert.equal(ready.deleteTopicQueries, true);
    assert.equal(ready.deleteMinioObjects, true);
    assert.equal(ready.deleteExamTombstone, false);
  });

  it("never implies Study/Content deletion", () => {
    const ready = decidePurge({
      phase: "archived",
      examDate: new Date("2019-01-01"),
      archivedAt: new Date("2019-02-01"),
      purgeEligibleAt: new Date("2019-02-01"),
      now: new Date("2025-01-01"),
      config: { dropTombstone: true },
    });
    // Tombstone drop is Discovery Exam row only.
    assert.equal(ready.deleteExamTombstone, true);
    assert.ok(ready.action === "hard_delete_discovery");
  });
});
