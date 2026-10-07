import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { JevDecision } from "@quizzeira/worker-kit";
import type { KnowledgeChunkDraft } from "./chunker.js";
import {
  MAX_CHUNKS_PER_BATCH,
  MAX_LEAF_CANDIDATES,
  NONE_OPTION,
  assignmentsFromJev,
  buildMappingQuestions,
  mapChunksLlmResidue,
  selectAmbiguous,
} from "./mapping-llm.js";
import type { ChunkMapResult, SyllabusLeafRef } from "./mapping.js";

function leaf(i: number): SyllabusLeafRef {
  return { id: `leaf-${i}`, title: `Folha ${i}`, pathSlug: `lp/f${i}`, canonicalKey: `lp:f${i}`, canonicalSubjectId: "lp" };
}
function chunk(ordinal: number): KnowledgeChunkDraft {
  return { ordinal, text: `Trecho ${ordinal} sobre concordância.`, contentHash: `h${ordinal}` } as unknown as KnowledgeChunkDraft;
}
function ambiguousMap(ordinal: number, score = 0.5): ChunkMapResult {
  return { chunkOrdinal: ordinal, syllabusNodeId: "leaf-0", canonicalKey: "lp:f0", score, method: "lexical_t1" };
}

function jevDecision(assign: Record<number, string>, p = 0.9): JevDecision<Record<string, never>> {
  const answers: Record<string, unknown> = {};
  for (const [i, choice] of Object.entries(assign)) {
    answers[`chunk_${i}`] = { type: "choice", choice, probabilities: { [choice]: p, [choice === NONE_OPTION ? "0" : NONE_OPTION]: 1 - p }, confidence: p };
  }
  return {
    answers: answers as never,
    meta: { task: "mapping", provider: "jev", mode: "shadow", requestedModel: "jev-1.13.0", returnedModel: "jev-1.13.0", durationMs: 1, attempts: 1, usage: null, estimatedUsd: null, costStatus: "unknown", errorCode: null },
  };
}

describe("mapping T3 residue — batched JEV Choice", () => {
  it("selects only the ambiguous band and honors batch bounds", () => {
    const chunks = Array.from({ length: 12 }, (_, i) => chunk(i));
    const existing = [
      ...chunks.slice(0, 10).map((c) => ambiguousMap(c.ordinal, 0.5)),
      ambiguousMap(10, 0.9),
      ambiguousMap(11, 0.1),
    ];
    const picked = selectAmbiguous(chunks, existing);
    assert.equal(picked.length, MAX_CHUNKS_PER_BATCH);
    assert.ok(picked.every((c) => c.ordinal < 10));
  });

  it("one question per chunk; criteria are leaf indices + none", () => {
    const leaves = Array.from({ length: 15 }, (_, i) => leaf(i)).slice(0, MAX_LEAF_CANDIDATES);
    const q = buildMappingQuestions([chunk(0), chunk(1)], leaves);
    assert.deepEqual(Object.keys(q), ["chunk_0", "chunk_1"]);
    const keys = Object.keys(q.chunk_0!.criteria);
    assert.equal(keys.length, MAX_LEAF_CANDIDATES + 1);
    assert.ok(keys.includes(NONE_OPTION));
  });

  it("assignmentsFromJev keeps indices inside the candidate set and maps none → null", () => {
    const out = assignmentsFromJev(
      {
        chunk_0: { choice: "1", probabilities: { "1": 0.8, none: 0.2 }, confidence: 0.8 },
        chunk_1: { choice: NONE_OPTION, probabilities: { none: 0.7, "0": 0.3 }, confidence: 0.7 },
        chunk_2: { choice: "9", probabilities: { "9": 1 }, confidence: 1 },
      },
      3,
      2,
    );
    assert.deepEqual(out, [
      { chunkIndex: 0, leafIndex: 1, confidence: 0.8 },
      { chunkIndex: 1, leafIndex: null, confidence: 0.7 },
    ]);
  });

  it("active: JEV assignments become llm_t3 maps; Gemini never called", async () => {
    let gemini = 0;
    const out = await mapChunksLlmResidue([chunk(0), chunk(1)], [leaf(0), leaf(1)], [ambiguousMap(0), ambiguousMap(1)], {
      mode: "active",
      generate: (async () => { gemini += 1; return { mappings: [] }; }) as never,
      jev: (async () => jevDecision({ 0: "1", 1: NONE_OPTION })) as never,
    });
    assert.equal(gemini, 0);
    assert.deepEqual(out, [
      { chunkOrdinal: 0, syllabusNodeId: "leaf-1", canonicalKey: "lp:f1", score: 0.9, method: "llm_t3" },
    ]);
  });

  it("shadow: Gemini result stands and the comparison is logged", async () => {
    const logged: Array<Record<string, unknown>> = [];
    const log = { info: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); }, warn: (_m: string, f?: Record<string, unknown>) => { logged.push(f ?? {}); } };
    const out = await mapChunksLlmResidue([chunk(0)], [leaf(0), leaf(1)], [ambiguousMap(0)], {
      mode: "shadow",
      hasProvider: () => true,
      generate: (async () => ({ mappings: [{ chunkIndex: 0, leafIndex: 0, confidence: 0.75 }] })) as never,
      jev: (async () => jevDecision({ 0: "1" })) as never,
      log,
    });
    assert.deepEqual(out.map((m) => m.syllabusNodeId), ["leaf-0"]);
    const shadow = logged.find((f) => f.event === "jev_shadow");
    assert.equal(shadow?.compared, 1);
    assert.equal(shadow?.agree, 0);
  });

  it("active: JEV failure propagates (no Gemini substitute)", async () => {
    await assert.rejects(
      mapChunksLlmResidue([chunk(0)], [leaf(0)], [ambiguousMap(0)], {
        mode: "active",
        jev: (async () => { throw Object.assign(new Error("JEV timeout: request failed"), { code: "llm_provider_failed" }); }) as never,
      }),
      /JEV timeout/,
    );
  });
});
