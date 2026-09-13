import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  combineLexEmb,
  cosineSimilarity,
  leafEmbeddingText,
  mapChunksEmbedding,
  mapChunksLexical,
  mergeMapResults,
  type SyllabusLeafRef,
} from "./mapping.js";
import type { KnowledgeChunkDraft } from "./chunker.js";

function leaf(partial: Partial<SyllabusLeafRef> & { id: string; title: string }): SyllabusLeafRef {
  return {
    pathSlug: partial.pathSlug ?? `lingua-portuguesa/${partial.title}`,
    canonicalKey: partial.canonicalKey ?? `lp:${partial.id}`,
    canonicalSubjectId: partial.canonicalSubjectId ?? "lingua-portuguesa",
    embedding: partial.embedding ?? null,
    parentTitle: partial.parentTitle ?? "Sintaxe",
    ...partial,
  };
}

function chunk(ordinal: number, text: string): KnowledgeChunkDraft {
  return {
    ordinal,
    sectionId: "s1",
    sectionRole: "content",
    text,
    tokenCount: Math.ceil(text.length / 4),
    contentHash: `h${ordinal}`,
  };
}

describe("syllabus mapping §21", () => {
  it("builds leaf embedding text S — T — L", () => {
    assert.equal(
      leafEmbeddingText(
        leaf({
          id: "1",
          title: "Concordância verbal",
          pathSlug: "lingua-portuguesa/sintaxe/concordancia-verbal",
        }),
      ),
      "lingua-portuguesa — sintaxe — Concordância verbal",
    );
  });

  it("combines lex and emb 50/50", () => {
    assert.equal(combineLexEmb(1, 0), 0.5);
    assert.equal(combineLexEmb(0.8, 0.6), 0.7);
  });

  it("accepts embedding_t2 when map≥0.62 and margin≥0.05", () => {
    const leaves = [
      leaf({
        id: "a",
        title: "Concordância verbal",
        embedding: [1, 0, 0],
      }),
      leaf({
        id: "b",
        title: "Crase",
        embedding: [0, 1, 0],
      }),
    ];
    const chunks = [
      chunk(0, "A concordância verbal estabelece que o verbo concorda com o sujeito em número."),
    ];
    const embMaps = mapChunksEmbedding(chunks, leaves, new Map([[0, [1, 0, 0]]]));
    assert.ok(embMaps.some((m) => m.method === "embedding_t2" && m.syllabusNodeId === "a"));
  });

  it("merges preferring embedding_t2 over lexical", () => {
    const lex = mapChunksLexical(
      [chunk(0, "Concordância verbal sujeito verbo")],
      [leaf({ id: "a", title: "Concordância verbal" })],
    );
    const emb: ReturnType<typeof mapChunksEmbedding> = [
      {
        chunkOrdinal: 0,
        syllabusNodeId: "a",
        canonicalKey: "lp:a",
        score: 0.8,
        method: "embedding_t2",
      },
    ];
    const merged = mergeMapResults(lex, emb);
    const hit = merged.find((m) => m.syllabusNodeId === "a");
    assert.equal(hit?.method, "embedding_t2");
  });

  it("cosine is 1 for identical vectors", () => {
    assert.ok(Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
  });
});
