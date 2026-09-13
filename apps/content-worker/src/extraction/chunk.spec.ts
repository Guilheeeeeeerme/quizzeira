import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { estimateTokens } from "../stages/knowledge/chunker.js";

describe("knowledge chunker estimateTokens", () => {
  it("estimates ~4 chars per token", () => {
    assert.equal(estimateTokens("abcd"), 1);
    assert.equal(estimateTokens("abcdefgh"), 2);
  });
});
