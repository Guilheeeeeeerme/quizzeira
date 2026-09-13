import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCUMENT_ROLES,
  isCatalogMetadataEligible,
  isEmbedEligible,
  isGenerationEligible,
  isGenerationEligibleSection,
  isPreviousQuestionParseEligible,
  isSyllabusExtractionEligible,
  ROLE_ELIGIBILITY,
} from "./roles.js";

describe("pipeline roles", () => {
  it("defines all document roles in the eligibility matrix", () => {
    for (const role of DOCUMENT_ROLES) {
      for (const capability of Object.keys(ROLE_ELIGIBILITY)) {
        assert.equal(typeof ROLE_ELIGIBILITY[capability as keyof typeof ROLE_ELIGIBILITY][role], "boolean");
      }
    }
  });

  it("matches §6.5 eligibility matrix", () => {
    assert.equal(isSyllabusExtractionEligible("specification"), true);
    assert.equal(isSyllabusExtractionEligible("knowledge"), false);

    assert.equal(isPreviousQuestionParseEligible("evidence"), true);
    assert.equal(isPreviousQuestionParseEligible("specification"), false);

    assert.equal(isEmbedEligible("knowledge"), true);
    assert.equal(isEmbedEligible("administrative"), false);

    assert.equal(isGenerationEligible("knowledge"), true);
    assert.equal(isGenerationEligible("evidence"), false);

    assert.equal(isCatalogMetadataEligible("specification"), true);
    assert.equal(isCatalogMetadataEligible("administrative"), true);
    assert.equal(isCatalogMetadataEligible("knowledge"), false);
  });

  it("allows only content and legal_article sections for generation", () => {
    assert.equal(isGenerationEligibleSection("content"), true);
    assert.equal(isGenerationEligibleSection("legal_article"), true);
    assert.equal(isGenerationEligibleSection("syllabus"), false);
    assert.equal(isGenerationEligibleSection("registration"), false);
  });
});
