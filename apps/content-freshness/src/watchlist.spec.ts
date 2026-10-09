import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fingerprintFromHeaders, legislationWatchlist, selectWatchBatch } from "./watchlist.js";

describe("legislation-watchlist", () => {
  it("includes Constituição and key concurso statutes", () => {
    const ids = new Set(legislationWatchlist.entries.map((e) => e.id));
    assert.ok(ids.has("cf88"));
    assert.ok(ids.has("lei-8112"));
    assert.ok(ids.has("lei-14133"));
    assert.ok(ids.has("eoab"));
  });

  it("builds a stable fingerprint from response headers", () => {
    assert.equal(
      fingerprintFromHeaders({ etag: '"abc"', lastModified: "Wed, 01 Jan 2026 00:00:00 GMT", contentLength: "12" }),
      '"abc"|Wed, 01 Jan 2026 00:00:00 GMT|12',
    );
  });

  it("rotates the watch batch", () => {
    const a = selectWatchBatch(0, 3);
    assert.equal(a.items.length, 3);
    const b = selectWatchBatch(a.nextCursor, 3);
    assert.equal(b.items.length, 3);
  });
});
