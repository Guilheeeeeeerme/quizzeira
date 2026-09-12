// Concept: Brief → prompt → fixture LLM → parseGeneratedQuestionsV2 (§41.3 / §43.2.3).

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { parseGeneratedQuestionsV2 } from "@quizzeira/shared";
import { generateJson, resetBudgetForTests } from "@quizzeira/worker-kit";
import { buildGenerationBrief, looksLikeListingTriviaStem } from "./brief.js";
import { buildGenerationPromptV2, GENERATION_SYSTEM_PROMPT_V2 } from "./prompt.js";

describe("generation fixture harness (§41.3)", () => {
  const prevProvider = process.env.LLM_PROVIDER;
  const prevOrder = process.env.LLM_PROVIDER_ORDER;

  before(() => {
    process.env.LLM_PROVIDER = "fixture";
    process.env.LLM_PROVIDER_ORDER = "fixture";
    resetBudgetForTests();
  });

  after(() => {
    if (prevProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = prevProvider;
    if (prevOrder === undefined) delete process.env.LLM_PROVIDER_ORDER;
    else process.env.LLM_PROVIDER_ORDER = prevOrder;
  });

  it("Concordância verbal brief yields denylist-clean MCQ via fixture LLM", async () => {
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
    assert.ok(brief.constraints.stemDenylist.length > 0);

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
      for (const opt of q.options ?? []) {
        assert.equal(looksLikeListingTriviaStem(opt), false);
      }
    }
  });
});
