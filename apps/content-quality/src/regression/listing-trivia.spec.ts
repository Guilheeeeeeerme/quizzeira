/**
 * Regression: Image #1–#6 listing trivia must fail rung 2 (§43).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { describe, it } from "node:test";
import { classifyDocumentRole, normalizeHtmlDocument } from "@quizzeira/shared";
import { validateRelevance } from "../relevance.js";
import { decide } from "../gate.js";
import { validateStructure } from "../structural.js";

const fixtureDir = resolve(
  __dirname,
  "../../../../fixtures/golden/regression/listing-trivia",
);

describe("listing-trivia regression (§43)", () => {
  it("REG-DOC-001: listing page classifies as administrative", () => {
    const html = readFileSync(resolve(fixtureDir, "listing-page.html"), "utf8");
    const normalized = normalizeHtmlDocument(html);
    const role = classifyDocumentRole({
      url: "https://portal.example/concursos",
      label: "Concursos abertos",
      kindHint: "listing",
      roleHint: "administrative",
      text: normalized.text,
    });
    assert.equal(role.role, "administrative");
    assert.ok(role.confidence >= 0.75);
    assert.notEqual(role.method, "llm");
  });

  it("REG-001..006: screenshot questions fail metadata / KU checks", () => {
    const questions = JSON.parse(
      readFileSync(resolve(fixtureDir, "questions.json"), "utf8"),
    ) as Array<{
      id: string;
      prompt: string;
      options: string[];
      correctIndex: number;
      syllabusNodeId: string;
      knowledgeUnitIds: string[];
    }>;

    assert.equal(questions.length, 6);

    const decisions: string[] = [];
    for (const q of questions) {
      const structural = validateStructure({
        type: "MULTIPLE_CHOICE",
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
      });
      const relevance = validateRelevance({
        prompt: q.prompt,
        options: q.options,
        origin: "generation",
        syllabusNodeId: q.syllabusNodeId,
        knowledgeUnitIds: q.knowledgeUnitIds,
      });
      const verdict = decide({
        structural,
        relevance,
        judge: null,
        correctIndex: q.correctIndex,
        thresholds: { publish: 0.8, fail: 0.4 },
        origin: "generation",
      });
      decisions.push(verdict.decision);
      assert.equal(verdict.decision, "failed", q.id);
      assert.ok(
        relevance.reasons.includes("tests_exam_metadata") ||
          relevance.reasons.includes("knowledge_unit_ids_missing"),
        `${q.id} reasons=${relevance.reasons.join(",")}`,
      );
      assert.ok(
        relevance.reasons.includes("knowledge_unit_ids_missing"),
        `${q.id} must miss KUs`,
      );
    }

    // REG-005 vs REG-002 near-dup when both present
    const a = questions.find((q) => q.id === "REG-002")!;
    const b = questions.find((q) => q.id === "REG-005")!;
    const dup = validateRelevance({
      prompt: b.prompt,
      options: b.options,
      origin: "generation",
      syllabusNodeId: b.syllabusNodeId,
      knowledgeUnitIds: ["ku_dummy"],
      existingStems: [a.prompt],
    });
    assert.ok(dup.reasons.includes("duplicate_question") || dup.reasons.includes("tests_exam_metadata"));
  });
});
