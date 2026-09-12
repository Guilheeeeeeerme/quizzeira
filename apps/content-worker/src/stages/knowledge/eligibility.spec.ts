import assert from "node:assert/strict";
import { test } from "node:test";
import { decideEligibility } from "./eligibility.js";
import type { KnowledgeChunkDraft } from "./chunker.js";

const adminScores = {
  contentDensity: 0.1,
  metadataProbability: 0.85,
  educationalSignal: 0,
  testability: 0,
  noise: 0.1,
  sectionQuality: 0,
};

const chunk: KnowledgeChunkDraft = {
  sectionId: "sec-1",
  sectionRole: "registration",
  ordinal: 0,
  text: "O candidato deverá efetuar inscrição online. Taxa R$ 80,00. Boleto disponível.",
  tokenCount: 20,
  contentHash: "abc",
};

test("admin section is ineligible (metadata + section_role)", () => {
  const decision = decideEligibility({
    documentRole: "specification",
    sectionRole: "registration",
    language: "pt",
    chunk,
    scores: adminScores,
    isDuplicate: false,
    mapScore: null,
  });
  assert.equal(decision.status, "ineligible");
  assert.ok(["section_role", "metadata", "role"].includes(decision.reason));
});
