import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  allowExamDateHardDelete,
  awaitsKnowledgeExtraction,
  decideCalendarGc,
  isKnowledgeUseful,
} from "./gc.js";

const NOW = new Date("2026-09-23T12:00:00Z");

describe("knowledge usefulness", () => {
  it("treats specification/edital as knowledge-useful", () => {
    assert.equal(isKnowledgeUseful({ roleHint: "specification" }), true);
    assert.equal(isKnowledgeUseful({ kind: "edital" }), true);
    assert.equal(isKnowledgeUseful({ kindHint: "prova" }), true);
    assert.equal(isKnowledgeUseful({ roleHint: "administrative", kind: "other", kindHint: "listing" }), false);
  });

  it("awaits extraction only for unpublished stored knowledge bytes", () => {
    assert.equal(
      awaitsKnowledgeExtraction({
        roleHint: "specification",
        published: false,
        storageKey: "artifacts/abc",
      }),
      true,
    );
    assert.equal(
      awaitsKnowledgeExtraction({
        roleHint: "specification",
        published: true,
        storageKey: "artifacts/abc",
      }),
      false,
    );
    assert.equal(
      awaitsKnowledgeExtraction({
        roleHint: "administrative",
        published: false,
        storageKey: "artifacts/abc",
      }),
      false,
    );
  });
});

describe("decideCalendarGc", () => {
  it("fail-closed when year missing", () => {
    const d = decideCalendarGc({
      phase: "registration_closed",
      signals: { title: "Sem ano" },
      artifacts: [],
      now: NOW,
    });
    assert.equal(d.action, "none");
    assert.equal(d.reason, "gc_year_missing");
  });

  it("retains current and future product years", () => {
    const current = decideCalendarGc({
      phase: "archived",
      signals: { editionKey: "2026" },
      artifacts: [],
      now: NOW,
    });
    assert.equal(current.action, "none");
    assert.equal(current.reason, "gc_retain_product_year");

    const future = decideCalendarGc({
      phase: "archived",
      signals: { editionKey: "2027" },
      artifacts: [],
      now: NOW,
    });
    assert.equal(future.reason, "gc_retain_product_year");
  });

  it("holds past-year while knowledge bytes await Content import", () => {
    const d = decideCalendarGc({
      phase: "archived",
      signals: { editionKey: "2024", examSlug: "foo-2024" },
      artifacts: [
        {
          roleHint: "specification",
          kind: "edital",
          published: false,
          storageKey: "artifacts/sha",
        },
      ],
      now: NOW,
    });
    assert.equal(d.action, "none");
    assert.equal(d.reason, "gc_hold_pending_knowledge");
    assert.equal(d.pendingKnowledge, 1);
  });

  it("soft-archives past-year once knowledge settled", () => {
    const d = decideCalendarGc({
      phase: "past_due",
      signals: { editionKey: "2024" },
      artifacts: [
        {
          roleHint: "specification",
          published: true,
          storageKey: "artifacts/sha",
        },
        {
          roleHint: "administrative",
          kindHint: "listing",
          published: false,
          storageKey: "artifacts/listing",
        },
      ],
      now: NOW,
    });
    assert.equal(d.action, "soft_archive");
    assert.equal(d.reason, "gc_past_year_soft_archive");
  });

  it("hard-deletes Discovery storage for archived past-year garbage", () => {
    const d = decideCalendarGc({
      phase: "archived",
      signals: { editionKey: "2023", title: "Old 2023" },
      artifacts: [
        { roleHint: "administrative", kindHint: "listing", storageKey: "artifacts/x" },
      ],
      now: NOW,
      dropTombstone: false,
    });
    assert.equal(d.action, "hard_delete_discovery");
    assert.equal(d.deleteArtifacts, true);
    assert.equal(d.deleteMinioObjects, true);
    assert.equal(d.deleteExamTombstone, false);
    assert.equal(d.reason, "gc_past_year_hard_delete");
  });

  it("marks dry-run reason without changing delete flags", () => {
    const d = decideCalendarGc({
      phase: "archived",
      signals: { editionKey: "2022" },
      artifacts: [],
      now: NOW,
      dryRun: true,
    });
    assert.equal(d.action, "hard_delete_discovery");
    assert.equal(d.reason, "gc_past_year_hard_delete_dry_run");
    assert.equal(d.deleteArtifacts, true);
  });

  it("purges past-year worthless listing-only exams", () => {
    const d = decideCalendarGc({
      phase: "archived",
      signals: { examSlug: "portal-2021", title: "Portal 2021" },
      artifacts: [
        { roleHint: "unknown", kind: "other", kindHint: "listing", published: false, storageKey: "k" },
      ],
      now: NOW,
    });
    assert.equal(d.action, "hard_delete_discovery");
  });
});

describe("allowExamDateHardDelete", () => {
  it("blocks current-year and ambiguous years", () => {
    assert.equal(
      allowExamDateHardDelete({ editionKey: "2026" }, NOW).allowed,
      false,
    );
    assert.equal(
      allowExamDateHardDelete({ title: "nope" }, NOW).allowed,
      false,
    );
    assert.equal(
      allowExamDateHardDelete({ editionKey: "2024" }, NOW).allowed,
      true,
    );
  });
});
