// Concept: Demote-legacy endpoint + admin syllabus needs_review (§40.4 / §48.3 / §48.7).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";

const QUALITY = resolve(__dirname, "./quality.ts");
const ADMIN = resolve(__dirname, "../admin.ts");
const GENERATION = resolve(__dirname, "./generation.ts");

describe("demote-legacy + admin syllabus needs_review + previousQuestionId (§30/§40/§48)", () => {
  const quality = readFileSync(QUALITY, "utf8");
  const admin = readFileSync(ADMIN, "utf8");
  const generation = readFileSync(GENERATION, "utf8");

  it("exposes demote-legacy-generation with legacy_pre_redesign", () => {
    assert.match(quality, /\/internal\/question-items\/demote-legacy-generation/);
    assert.match(quality, /failReasons:\s*\[["']legacy_pre_redesign["']\]/);
    assert.match(quality, /origin:\s*"generation"/);
    assert.match(quality, /publishedAt:\s*null/);
  });

  it("admin syllabi falls back to needs_review and returns rawSections", () => {
    assert.match(admin, /\/admin\/syllabi\/:examSlug/);
    assert.match(admin, /rawSections/);
    assert.match(
      admin,
      /syllabus\.status\s*===\s*"needs_review"\s*&&\s*syllabus\.sourceDocumentId/,
    );
  });

  it("generation drafts soft-strip previousQuestionId (§30)", () => {
    assert.match(
      generation,
      /previousQuestionId is transcription\/OAB provenance only[\s\S]*?origin === "transcription"/,
    );
  });
});
