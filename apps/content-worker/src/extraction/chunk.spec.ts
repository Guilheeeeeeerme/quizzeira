import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkText, estimateTokens } from "./chunk";

const options = { targetChars: 200, overlapChars: 40, maxChunks: 10 };

test("empty input yields no chunks", () => {
  assert.deepEqual(chunkText("   \n\n  ", options), []);
});

test("short documents stay in a single chunk", () => {
  const text = "Artigo 1. O concurso destina-se ao provimento de cargos efetivos do quadro.";
  const chunks = chunkText(text, options);
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, text);
});

test("paragraphs are packed up to the target size", () => {
  const paragraph = "a".repeat(120);
  const chunks = chunkText([paragraph, paragraph, paragraph].join("\n\n"), options);
  assert.ok(chunks.length >= 2, "expected the text to split across chunks");
  for (const chunk of chunks) {
    assert.ok(chunk.text.length <= options.targetChars + options.overlapChars);
  }
});

test("an oversized paragraph is hard split instead of overflowing", () => {
  const chunks = chunkText("b".repeat(1000), options);
  assert.equal(chunks.length, 5);
  for (const chunk of chunks) {
    assert.ok(chunk.text.length <= options.targetChars);
  }
});

test("fragments below the floor are dropped", () => {
  assert.deepEqual(chunkText("curto", options), []);
});

test("chunks carry a token estimate", () => {
  const chunks = chunkText("c".repeat(160), options);
  assert.equal(chunks[0].tokenCount, estimateTokens(chunks[0].text));
  assert.ok(chunks[0].tokenCount > 0);
});

test("maxChunks caps the output", () => {
  const chunks = chunkText("d".repeat(5000), { ...options, maxChunks: 3 });
  assert.equal(chunks.length, 3);
});
