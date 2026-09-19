// Concept: import pass claims from the durable job lease layer (§5, item 1b)
// instead of polling published=false. Guard the HTTP contract against drift —
// the job "kind" string here must match discovery-api's
// IMPORT_ARTIFACT_JOB_KIND (src/routes/internal/artifacts.ts).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const IMPORT_SRC = resolve(__dirname, "./import.ts");
const ARTIFACTS_SRC = resolve(
  __dirname,
  "../../../discovery-api/src/routes/internal/artifacts.ts",
);

describe("content-worker import pass ↔ discovery-api job kind contract", () => {
  const importSrc = readFileSync(IMPORT_SRC, "utf8");
  const artifactsSrc = readFileSync(ARTIFACTS_SRC, "utf8");

  it("claims the same job kind discovery-api enqueues on artifact creation", () => {
    const workerKind = /const JOB_KIND = "([^"]+)"/.exec(importSrc)?.[1];
    const apiKind = /IMPORT_ARTIFACT_JOB_KIND = "([^"]+)"/.exec(artifactsSrc)?.[1];
    assert.ok(workerKind, "content-worker must define JOB_KIND");
    assert.ok(apiKind, "discovery-api must define IMPORT_ARTIFACT_JOB_KIND");
    assert.equal(workerKind, apiKind);
  });

  it("claims via /internal/jobs/claim rather than polling published=false", () => {
    assert.match(importSrc, /\/internal\/jobs\/claim/);
    assert.doesNotMatch(importSrc, /discovery\.get[\s\S]{0,80}published=false/);
  });

  it("resolves every claimed job to complete or fail, never left dangling", () => {
    assert.match(importSrc, /\/internal\/jobs\/\$\{job\.id\}\/complete/);
    assert.match(importSrc, /\/internal\/jobs\/\$\{job\.id\}\/fail/);
  });

  it("still sets published=true for back-compat readers of the old flag", () => {
    assert.match(importSrc, /published: true/);
  });
});
