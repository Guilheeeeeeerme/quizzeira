import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTopicQueries } from "@quizzeira/shared";
import { TARGET_KU_PER_LEAF, MAX_TOPIC_QUERIES_PER_PASS } from "./planner.js";

describe("coverage planner §17.5", () => {
  it("uses shared query templates", () => {
    const queries = buildTopicQueries({
      subject: "Língua Portuguesa",
      topic: "Sintaxe",
      subtopic: "Concordância verbal",
      max: 3,
    });
    assert.equal(queries.length, 3);
    assert.ok(queries[0]!.toLowerCase().includes("portuguesa"));
    assert.ok(queries.some((q) => /sintaxe|concord/i.test(q)));
  });

  it("exports TARGET_KU and pass cap", () => {
    assert.equal(TARGET_KU_PER_LEAF, 12);
    assert.equal(MAX_TOPIC_QUERIES_PER_PASS, 20);
  });
});
