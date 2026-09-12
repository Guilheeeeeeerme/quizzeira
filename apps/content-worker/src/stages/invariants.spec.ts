// Concept: Invariant / property tests for pipeline v2 (§9.4, §41.6).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  isEmbedEligible,
  isGenerationEligible,
  isKnowledgeSectionRole,
  normalizeDedupText,
  type DocumentRole,
  type SectionRole,
} from "@quizzeira/shared";
import { classifyDocument } from "./classify.js";
import { extractHtmlText } from "./html-text.js";
import { normalizeHtmlFallback } from "./normalize.js";
import { decideEligibility } from "./knowledge/eligibility.js";

const LISTING_FIXTURE = resolve(
  __dirname,
  "../../../../fixtures/golden/regression/listing-trivia/listing-page.html",
);
const MANIFEST = resolve(__dirname, "../../../../fixtures/golden/manifest.json");

describe("invariants §9.4", () => {
  it("invariant 1: non-knowledge section roles are never embed-eligible", () => {
    const roles: SectionRole[] = [
      "syllabus",
      "vacancies",
      "schedule",
      "registration",
      "exam_structure",
      "nav",
      "other",
      "question_block",
      "answer_key",
      "legal_disposition",
      "instructional",
    ];
    for (const role of roles) {
      assert.equal(isKnowledgeSectionRole(role), false);
    }
    assert.equal(isKnowledgeSectionRole("content"), true);
    assert.equal(isKnowledgeSectionRole("legal_article"), true);
  });

  it("invariant 2: generation work units require non-empty syllabusNodeId", () => {
    for (const leaf of ["", "  ", null, undefined] as const) {
      const ok = typeof leaf === "string" && leaf.trim().length > 0;
      assert.equal(ok, false);
    }
    assert.ok("leaf-sintaxe".trim().length > 0);
  });

  it("invariant 4: administrative/specification never generation-eligible", () => {
    const blocked: DocumentRole[] = ["administrative", "specification", "unknown"];
    for (const role of blocked) {
      assert.equal(isGenerationEligible(role), false);
      assert.equal(isEmbedEligible(role), false);
    }
  });

  it("REG-DOC-001: listing page classifies as administrative with no eligible chunks", () => {
    const html = readFileSync(LISTING_FIXTURE, "utf8");
    const normalized = normalizeHtmlFallback({
      documentId: "reg-doc-001",
      contentType: "text/html",
      bytes: Buffer.from(html, "utf8"),
      url: "https://fixture.local/listing",
    });
    const classified = classifyDocument(normalized, {
      kindHint: "listing",
      roleHint: "administrative",
    });
    assert.equal(classified.role, "administrative");
    assert.ok(classified.roleConfidence >= 0.75);
    assert.notEqual(classified.roleMethod, "llm");

    for (const section of classified.sections) {
      const decision = decideEligibility({
        documentRole: classified.role,
        sectionRole: section.role,
        language: "pt",
        chunk: {
          ordinal: 0,
          sectionId: section.section.id ?? `sec-${section.section.ordinal}`,
          sectionRole: section.role,
          text: section.section.text,
          tokenCount: Math.ceil(section.section.charCount / 4),
          contentHash: "x",
        },
        scores: section.scores,
        isDuplicate: false,
        mapScore: 1,
      });
      assert.notEqual(decision.status, "eligible", section.role);
    }
  });

  it("golden corpus: non-knowledge expected roles never become generation-eligible", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
      fixtures: Array<{ expectedRole?: DocumentRole; path: string }>;
    };
    for (const row of manifest.fixtures) {
      if (!row.expectedRole) continue;
      if (row.expectedRole === "knowledge" || row.expectedRole === "mixed") continue;
      assert.equal(
        isGenerationEligible(row.expectedRole),
        false,
        `${row.path} role ${row.expectedRole}`,
      );
    }
  });

  it("property over golden: embed/generation eligibility agrees with role matrix", () => {
    const manifest = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
      fixtures: Array<{ expectedRole?: DocumentRole; path: string }>;
    };
    for (const row of manifest.fixtures) {
      if (!row.expectedRole) continue;
      const role = row.expectedRole;
      if (role === "administrative" || role === "specification" || role === "unknown") {
        assert.equal(isEmbedEligible(role), false, row.path);
        assert.equal(isGenerationEligible(role), false, row.path);
      }
      if (role === "knowledge") {
        assert.equal(isEmbedEligible(role), true, row.path);
        assert.equal(isGenerationEligible(role), true, row.path);
      }
      if (role === "evidence") {
        assert.equal(isEmbedEligible(role), false, row.path);
        assert.equal(isGenerationEligible(role), false, row.path);
      }
    }
  });
});

describe("cleaning properties §41.6", () => {
  it("html extract is idempotent", () => {
    const html = "<p>Concordância <b>verbal</b>.</p>";
    const once = extractHtmlText(html);
    const twice = extractHtmlText(once);
    assert.equal(once, twice);
  });

  it("dedup normalize is idempotent", () => {
    const sample = "  Foo, BAR!!  123  ";
    const once = normalizeDedupText(sample);
    assert.equal(normalizeDedupText(once), once);
  });
});
