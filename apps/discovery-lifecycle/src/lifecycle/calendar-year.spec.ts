import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isPastCalendarYear,
  isProductInventoryYear,
  resolveExamYear,
} from "./calendar-year.js";

describe("resolveExamYear", () => {
  it("uses examDate when it is the only year signal", () => {
    const r = resolveExamYear({
      examDate: new Date("2024-06-15T12:00:00Z"),
      title: "Concurso Foo",
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.year, 2024);
  });

  it("fail-closed on conflicting years", () => {
    const r = resolveExamYear({
      examDate: new Date("2024-06-15T12:00:00Z"),
      title: "Concurso Foo 2023",
      editionKey: "2023",
    });
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.reason, "conflicting_years");
      assert.deepEqual(r.years, [2023, 2024]);
    }
  });

  it("accepts editionKey 2026.1", () => {
    const r = resolveExamYear({ editionKey: "2026.1" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.year, 2026);
  });

  it("reads year from examSlug", () => {
    const r = resolveExamYear({ examSlug: "pm-al-2025" });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.year, 2025);
  });

  it("fail-closed when no year signal", () => {
    const r = resolveExamYear({ title: "Edital geral", examSlug: "foo-bar" });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.reason, "missing_year");
  });

  it("agrees when signals share one year", () => {
    const r = resolveExamYear({
      examDate: new Date("2025-03-01T00:00:00Z"),
      editionKey: "2025",
      examSlug: "tce-go-2025",
      title: "TCE-GO 2025",
    });
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.year, 2025);
  });
});

describe("calendar year helpers", () => {
  const now = new Date("2026-09-23T12:00:00Z");

  it("past year is before current UTC year", () => {
    assert.equal(isPastCalendarYear(2025, now), true);
    assert.equal(isPastCalendarYear(2026, now), false);
    assert.equal(isProductInventoryYear(2026, now), true);
    assert.equal(isProductInventoryYear(2027, now), true);
    assert.equal(isProductInventoryYear(2025, now), false);
  });
});
