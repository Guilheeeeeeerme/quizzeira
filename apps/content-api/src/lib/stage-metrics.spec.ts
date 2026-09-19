// Concept: StageMetric service tagging (§12 Next item 4: shadow-profile
// comparison). Without a `service` dimension, content-worker's monolith and
// its shadow-profile split (documents/embeddings/generation) write into the
// same undifferentiated rows, making split-vs-monolith comparison impossible.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { recordStageMetric } from "./stage-metrics";

function fakeClient() {
  const calls: unknown[] = [];
  return {
    calls,
    client: {
      stageMetric: {
        upsert: async (args: unknown) => {
          calls.push(args);
          return {};
        },
      },
    },
  };
}

describe("recordStageMetric", () => {
  it("includes service in the unique key and the created row", async () => {
    const { client, calls } = fakeClient();
    await recordStageMetric(client, {
      stage: "process",
      decision: "administrative",
      service: "quizzeira-contentworker-documents",
    });
    const args = calls[0] as {
      where: { hourBucket_stage_decision_reason_service: { service: string } };
      create: { service: string };
    };
    assert.equal(args.where.hourBucket_stage_decision_reason_service.service, "quizzeira-contentworker-documents");
    assert.equal(args.create.service, "quizzeira-contentworker-documents");
  });

  it("defaults service to an empty string for emitters that don't set one (content-api's own)", async () => {
    const { client, calls } = fakeClient();
    await recordStageMetric(client, { stage: "eval", decision: "published" });
    const args = calls[0] as {
      where: { hourBucket_stage_decision_reason_service: { service: string } };
    };
    assert.equal(args.where.hourBucket_stage_decision_reason_service.service, "");
  });

  it("the monolith and a shadow-profile service produce distinct keys for the same stage/decision", async () => {
    const { client, calls } = fakeClient();
    await recordStageMetric(client, {
      stage: "process",
      decision: "ok",
      service: "quizzeira-contentworker",
    });
    await recordStageMetric(client, {
      stage: "process",
      decision: "ok",
      service: "quizzeira-contentworker-documents",
    });
    const keys = calls.map(
      (c) => (c as { where: { hourBucket_stage_decision_reason_service: { service: string } } }).where
        .hourBucket_stage_decision_reason_service.service,
    );
    assert.deepEqual(new Set(keys).size, 2);
  });
});
