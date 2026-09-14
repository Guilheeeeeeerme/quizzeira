import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTopicQueries } from "@quizzeira/shared";
import { TARGET_KU_PER_LEAF, MAX_TOPIC_QUERIES_PER_PASS, queryVarsForLeaf } from "./planner.js";

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

  it("builds search text from the title path, not slugs", () => {
    const vars = queryVarsForLeaf({
      path: ["Língua Portuguesa", "Sintaxe", "Concordância verbal e nominal"],
      pathSlug: "lingua-portuguesa/sintaxe/concordancia-verbal-e-nominal",
      title: "Concordância verbal e nominal",
    });
    assert.equal(vars.subject, "Língua Portuguesa");
    assert.equal(vars.topic, "Sintaxe");
    assert.equal(vars.subtopic, "Concordância verbal e nominal");
  });

  it("humanizes slug-only paths as a fallback", () => {
    const vars = queryVarsForLeaf({
      path: [],
      pathSlug: "lingua-portuguesa/concordancia-verbal-e-nominal",
      title: "Concordância verbal e nominal",
    });
    assert.equal(vars.subject, "lingua portuguesa");
    assert.equal(vars.topic, "concordancia verbal e nominal");
    assert.ok(!vars.topic.includes("-"));
  });
});
