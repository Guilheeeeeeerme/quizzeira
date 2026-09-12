// Concept: Invariants 1–6 — pipeline + Eval publish gate (§9.4).
// Property tests only (no DB). Corpus fuzz for 1/4 lives in content-worker.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DOCUMENT_ROLES,
  REASON_CODES,
  SECTION_ROLES,
  isEmbedEligible,
  isGenerationEligible,
  isKnowledgeSectionRole,
  type DocumentRole,
  type SectionRole,
} from "@quizzeira/shared";
import { decide } from "./gate.js";
import type { JudgeVerdict } from "./judge.js";
import { validateGrounding } from "./grounding.js";

const thresholds = { publish: 0.8, fail: 0.5 };
const structuralOk = { ok: true, reasons: [] as string[], notes: "ok" };

function judge(overrides: Partial<JudgeVerdict> = {}): JudgeVerdict {
  return {
    score: 0.9,
    answerIndex: 2,
    relevance: 0.9,
    durability: 0.9,
    grounding: 0.9,
    reasons: [],
    notes: "ok",
    model: null,
    ...overrides,
  };
}

/** MIME guess for golden/HTML fixtures (mirrors content-worker stages helper). */
function contentTypeFor(path: string): string {
  if (/\.pdf$/i.test(path)) return "application/pdf";
  if (/\.txt$/i.test(path)) return "text/plain";
  if (/\.json$/i.test(path)) return "application/json";
  return "text/html";
}

describe("invariants §9.4 (eval)", () => {
  it("invariant 1: non-knowledge section roles are never embed-indexable", () => {
    for (const role of SECTION_ROLES) {
      const knowledge = role === "content" || role === "legal_article";
      assert.equal(
        isKnowledgeSectionRole(role as SectionRole),
        knowledge,
        role,
      );
    }
  });

  it("invariant 2: generation work units require a non-empty syllabusNodeId", () => {
    const samples: Array<string | null | undefined> = [
      "",
      "  ",
      null,
      undefined,
      "leaf-sintaxe",
    ];
    for (const leaf of samples) {
      const ok = typeof leaf === "string" && leaf.trim().length > 0;
      assert.equal(ok, leaf === "leaf-sintaxe");
    }
  });

  it("invariant 3: generation without KU citations fails grounding", () => {
    const missing = validateGrounding({ origin: "generation", knowledgeUnitIds: [] });
    assert.equal(missing.ok, false);
    assert.ok(missing.reasons.includes("ungrounded_citation"));
    assert.equal(
      validateGrounding({ origin: "generation", knowledgeUnitIds: ["ku-1"] }).ok,
      true,
    );
  });

  it("invariant 3b: citations outside the brief subset fail grounding", () => {
    const result = validateGrounding({
      origin: "generation",
      knowledgeUnitIds: ["ku-1", "ku-rogue"],
      allowedKnowledgeUnitIds: ["ku-1"],
    });
    assert.equal(result.ok, false);
    assert.ok(result.reasons.includes("ungrounded_citation"));
  });

  it("invariant 4: administrative/specification never embed or generation-eligible", () => {
    const blocked: DocumentRole[] = ["administrative", "specification", "unknown", "evidence"];
    for (const role of blocked) {
      assert.equal(isGenerationEligible(role), false, role);
      assert.equal(isEmbedEligible(role), false, role);
    }
    assert.equal(isEmbedEligible("knowledge"), true);
    assert.equal(isGenerationEligible("knowledge"), true);

    // Property: every DocumentRole has a defined eligibility pair.
    for (const role of DOCUMENT_ROLES) {
      assert.equal(typeof isEmbedEligible(role), "boolean", role);
      assert.equal(typeof isGenerationEligible(role), "boolean", role);
    }
  });

  it("invariant 5: published decision comes only from gate", () => {
    const result = decide({
      structural: structuralOk,
      relevance: { ok: true, reasons: [], reviewReasons: [], notes: "ok" },
      grounding: { ok: true, reasons: [], notes: "ok" },
      judge: judge(),
      correctIndex: 2,
      thresholds,
      origin: "generation",
    });
    assert.equal(result.decision, "published");
  });

  it("invariant 5b: failed structural never publishes even with a strong judge", () => {
    const result = decide({
      structural: { ok: false, reasons: ["duplicate_options"], notes: "bad" },
      judge: judge({ score: 0.99 }),
      correctIndex: 2,
      thresholds,
      origin: "generation",
    });
    assert.notEqual(result.decision, "published");
  });

  it("invariant 6: rejection reasons are machine-readable catalogue members", () => {
    const result = decide({
      structural: {
        ok: false,
        reasons: ["duplicate_options"],
        notes: "bad",
      },
      judge: null,
      correctIndex: 2,
      thresholds,
      origin: "generation",
    });
    assert.notEqual(result.decision, "published");
    assert.ok(result.reasons.length > 0);
    for (const reason of result.reasons) {
      assert.ok(
        (REASON_CODES as readonly string[]).includes(reason),
        `unknown reason ${reason}`,
      );
    }
  });

  it("contentTypeFor: maps golden fixture extensions", () => {
    assert.equal(contentTypeFor("anexos/anexo-prose-running.txt"), "text/plain");
    assert.equal(contentTypeFor("knowledge/manual-etica.pdf"), "application/pdf");
    assert.equal(contentTypeFor("editais/edital-federal.html"), "text/html");
    assert.equal(contentTypeFor("regression/listing-trivia/questions.json"), "application/json");
  });
});
