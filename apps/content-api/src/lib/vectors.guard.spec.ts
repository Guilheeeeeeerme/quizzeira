// Concept: Knowledge-index SQL guard must stay in retrieval (§9.4 / §39.3).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const VECTORS = resolve(process.cwd(), "apps/content-api/src/lib/vectors.ts");

describe("vectors knowledge-index guard", () => {
  const src = readFileSync(VECTORS, "utf8");

  it("defines KNOWLEDGE_INDEX_GUARD with eligibility + role filters", () => {
    assert.match(src, /KNOWLEDGE_INDEX_GUARD/);
    assert.match(src, /eligibility.*=.*eligible/);
    assert.match(src, /'knowledge'::"DocumentRole"/);
    assert.match(src, /'content'::"SectionRole"/);
    assert.match(src, /legal_article/);
  });

  it("searchChunks joins ChunkSyllabusMap when leaf filters are set", () => {
    assert.match(src, /ChunkSyllabusMap/);
    assert.match(src, /syllabusNodeId/);
    assert.match(src, /canonicalKey/);
  });

  it("searchChunks never returns administrative/listing chunks without eligible guard off", () => {
    assert.match(src, /KNOWLEDGE_INDEX_GUARD/);
    assert.match(src, /'knowledge'::"DocumentRole"|role.*=.*'knowledge'/);
    assert.doesNotMatch(
      src,
      /role.*=.*'administrative'.*eligible/,
      "administrative docs must not be treated as knowledge-index eligible",
    );
  });
});
