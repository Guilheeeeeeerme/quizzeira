// Concept: In-process pipeline slice (§41.3) — no live Docker.
// Chains normalize → classify → syllabus parse → MCQ evidence → eligibility →
// brief → fixture LLM → parseGeneratedQuestionsV2.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { after, before, describe, it } from "node:test";
import { parseGeneratedQuestionsV2 } from "@quizzeira/shared";
import { generateJson, resetBudgetForTests, workerEnv } from "@quizzeira/worker-kit";
import { extractMcqs } from "./extraction/mcq.js";
import { buildGenerationBrief, looksLikeListingTriviaStem } from "./generation/brief.js";
import {
  buildGenerationPromptV2,
  GENERATION_SYSTEM_PROMPT_V2,
} from "./generation/prompt.js";
import { classifyDocument } from "./stages/classify.js";
import { extractHtmlText } from "./stages/html-text.js";
import { decideEligibility } from "./stages/knowledge/eligibility.js";
import { normalizeHtmlFallback } from "./stages/normalize.js";
import { parseSyllabusFromDocument } from "./stages/syllabus/parse.js";
import { discoverPositions } from "./stages/syllabus/positions.js";

const ROOT = resolve(__dirname, "../../../fixtures/golden");
const EDITAL = resolve(ROOT, "editais/edital-federal-cesgranrio.html");
const PROVA = resolve(ROOT, "provas/prova-inline-gabarito.html");
const LISTING = resolve(ROOT, "regression/listing-trivia/listing-page.html");

describe("in-process fixture pipeline (§41.3)", () => {
  const prevProvider = process.env.LLM_PROVIDER;
  const prevOrder = process.env.LLM_PROVIDER_ORDER;
  const prevMem = workerEnv.allowMemoryBudget;

  before(() => {
    process.env.LLM_PROVIDER = "fixture";
    process.env.LLM_PROVIDER_ORDER = "fixture";
    workerEnv.allowMemoryBudget = true;
    resetBudgetForTests();
  });

  after(() => {
    if (prevProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = prevProvider;
    if (prevOrder === undefined) delete process.env.LLM_PROVIDER_ORDER;
    else process.env.LLM_PROVIDER_ORDER = prevOrder;
    workerEnv.allowMemoryBudget = prevMem;
  });

  it("edital → specification syllabus; listing stays administrative; prova → MCQs", () => {
    const editalDoc = normalizeHtmlFallback({
      documentId: "edital-cesgranrio",
      contentType: "text/html",
      bytes: Buffer.from(readFileSync(EDITAL, "utf8"), "utf8"),
    });
    const editalClass = classifyDocument(editalDoc, {
      kindHint: "edital",
      roleHint: "specification",
    });
    assert.equal(editalClass.role, "specification");
    const positions = discoverPositions(editalDoc, editalClass.sections);
    const syllabus = parseSyllabusFromDocument(editalDoc, editalClass.sections, positions);
    assert.ok(syllabus.nodes.length > 0);
    assert.ok(
      syllabus.status === "active" || syllabus.status === "needs_review",
      "syllabus must resolve to active or needs_review",
    );

    const listingDoc = normalizeHtmlFallback({
      documentId: "listing",
      contentType: "text/html",
      bytes: Buffer.from(readFileSync(LISTING, "utf8"), "utf8"),
    });
    const listingClass = classifyDocument(listingDoc, {
      kindHint: "listing",
      roleHint: "administrative",
    });
    assert.equal(listingClass.role, "administrative");
    const listingElig = decideEligibility({
      documentRole: listingClass.role,
      sectionRole: "nav",
      language: "pt",
      chunk: {
        ordinal: 0,
        sectionId: "x",
        sectionRole: "nav",
        text: "x".repeat(400),
        tokenCount: 100,
        contentHash: "h",
      },
      scores: {
        contentDensity: 0.1,
        metadataProbability: 0.9,
        educationalSignal: 0.1,
        testability: 0.1,
        noise: 0.5,
        sectionQuality: 0.2,
      },
      isDuplicate: false,
      mapScore: null,
    });
    assert.notEqual(listingElig.status, "eligible");

    const provaHtml = readFileSync(PROVA, "utf8");
    const mcqs = extractMcqs(extractHtmlText(provaHtml));
    assert.ok(mcqs.length >= 2, `expected MCQs from inline gabarito, got ${mcqs.length}`);
    assert.ok(mcqs.every((q) => q.status === "ok"));

    // Separate gabarito + passage + ANULADA (§18.2).
    const provaBody = [
      "Texto para as questões 1 a 2",
      "A concordância verbal exige harmonia entre sujeito e verbo.",
      "",
      "1 - Assinale a alternativa correta.",
      "a) Os menino chegou.",
      "b) Os meninos chegaram.",
      "c) Os meninos chegou.",
      "d) Chegou os meninos.",
      "",
      "2 - O verbo haver impessoal:",
      "a) vai ao plural.",
      "b) fica no singular.",
      "c) é de ligação.",
      "d) exige objeto indireto.",
    ].join("\n");
    const key = "1 - B\n2 - ANULADA\n";
    const paired = extractMcqs(provaBody, key);
    assert.equal(paired.length, 2);
    assert.equal(paired[0]!.status, "ok");
    assert.equal(paired[0]!.correctIndex, 1);
    assert.ok(paired[0]!.passage && /concordância verbal/i.test(paired[0]!.passage));
    assert.equal(paired[1]!.status, "annulled");
    assert.equal(paired[1]!.correctIndex, null);
  });

  it("syllabus leaf + KU brief → fixture LLM → denylist-clean drafts", async () => {
    const brief = buildGenerationBrief({
      examTitle: "Concurso Federal",
      examSlug: "concurso-federal",
      syllabusNodeId: "leaf-concordancia",
      path: ["Língua Portuguesa", "Sintaxe", "Concordância verbal"],
      rawText: "Concordância verbal e nominal",
      knowledgeUnits: [
        {
          id: "ku-1",
          kind: "rule",
          statement:
            "Na concordância verbal, o verbo concorda com o sujeito em número e pessoa.",
          example: "Os candidatos chegaram cedo.",
          qualifiers: [],
          sourceDomain: "planalto.gov.br",
        },
      ],
      existingStems: [],
      count: 1,
    });

    const prompt = buildGenerationPromptV2(brief);
    const response = await generateJson<{ questions: unknown }>(
      GENERATION_SYSTEM_PROMPT_V2,
      prompt,
      { requiredKeys: ["questions"], tier: "mid", stage: "generation" },
    );
    const parsed = parseGeneratedQuestionsV2(response.questions, brief.syllabus.subtopic, [
      "ku-1",
    ]);
    assert.ok(parsed.length >= 1);
    for (const q of parsed) {
      assert.equal(looksLikeListingTriviaStem(q.prompt), false);
      assert.ok(!("previousQuestionId" in q && (q as { previousQuestionId?: string }).previousQuestionId));
    }
  });
});
