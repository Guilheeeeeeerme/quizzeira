// Concept: Provenance route must resolve §30 discovery + previous-question branches.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const PROVENANCE = resolve(__dirname, "./provenance.ts");
const DISCOVERY = resolve(__dirname, "../../lib/discovery-client.ts");
const ARTIFACTS = resolve(
  __dirname,
  "../../../../discovery-api/src/routes/internal/artifacts.ts",
);

describe("provenance §30 depth", () => {
  const src = readFileSync(PROVENANCE, "utf8");
  const discovery = readFileSync(DISCOVERY, "utf8");
  const artifacts = readFileSync(ARTIFACTS, "utf8");

  it("content-api resolves discovery artifacts for Artifact→Source/TopicQuery", () => {
    assert.match(src, /fetchArtifactProvenance/);
    assert.match(src, /chain:\s*\{[\s\S]*artifacts:/);
    assert.match(src, /topicQueries/);
    assert.match(src, /previousQuestion/);
    assert.match(src, /styleProfile/);
    assert.match(src, /tokensIn/);
    assert.match(discovery, /\/internal\/artifacts\//);
  });

  it("discovery-api exposes GET /internal/artifacts/:id with source + topicQuery", () => {
    assert.match(artifacts, /\/internal\/artifacts\/:id/);
    assert.match(artifacts, /include:\s*\{[\s\S]*source:\s*true/);
    assert.match(artifacts, /topicQuery:\s*true/);
  });
});
