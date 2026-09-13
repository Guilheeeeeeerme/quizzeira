import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { selectSourcesForPass } from "./source-order.js";

describe("selectSourcesForPass", () => {
  it("always includes topic_query sources and rotates the rest by lastOkAt", () => {
    const picked = selectSourcesForPass(
      [
        { id: "a", discoveryMode: "listing", lastOkAt: "2026-09-13T10:00:00Z" },
        { id: "b", discoveryMode: "listing", lastOkAt: null },
        { id: "t", discoveryMode: "topic_query", lastOkAt: "2026-09-13T12:00:00Z" },
        { id: "c", discoveryMode: "listing", lastOkAt: "2026-09-13T08:00:00Z" },
      ],
      3,
    );
    assert.deepEqual(
      picked.map((s) => s.id),
      ["t", "b", "c"],
    );
  });

  it("does not exceed the slice size", () => {
    const picked = selectSourcesForPass(
      [
        { id: "t1", discoveryMode: "topic_query" },
        { id: "t2", discoveryMode: "topic_query" },
        { id: "a", discoveryMode: "listing" },
      ],
      2,
    );
    assert.deepEqual(picked.map((s) => s.id), ["t1", "t2"]);
  });
});
