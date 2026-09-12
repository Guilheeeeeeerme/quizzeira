// Concept: ExamStyleProfile aggregation tests (§18.4 / §41.1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStyleProfile, type PreviousQuestionDraft } from "./style-profile.js";

function q(
  prompt: string,
  options: string[],
  passage: string | null = null,
): PreviousQuestionDraft {
  return {
    prompt,
    options,
    passage,
    banca: "Cebraspe",
    canonicalSubjectId: "lingua-portuguesa",
  };
}

describe("buildStyleProfile (§41.1)", () => {
  it("aggregates ~50 synthetic Cebraspe-style questions", () => {
    const questions: PreviousQuestionDraft[] = [];
    for (let i = 0; i < 50; i += 1) {
      const certoErrado = i % 3 === 0;
      const negative = i % 5 === 0;
      const stem = negative
        ? `Julgue o item seguinte sobre sintaxe ${i}. Está incorreto afirmar que…`
        : `Assinale a opção correta acerca de concordância verbal ${i}.`;
      questions.push(
        q(
          stem,
          certoErrado
            ? ["Certo", "Errado"]
            : [
                "Alternativa A com texto suficientemente longo para assertion style.",
                "Alternativa B com texto suficientemente longo para assertion style.",
                "Alternativa C com texto suficientemente longo para assertion style.",
                "Alternativa D com texto suficientemente longo para assertion style.",
                "Alternativa E com texto suficientemente longo para assertion style.",
              ],
          i % 7 === 0 ? "Texto-base do enunciado." : null,
        ),
      );
    }

    const { sampleSize, profile, banca } = buildStyleProfile(
      questions,
      "Cebraspe",
      "lingua-portuguesa",
    );
    assert.equal(sampleSize, 50);
    assert.equal(banca, "Cebraspe");
    assert.ok(profile.optionCount === 2 || profile.optionCount === 5);
    assert.ok(profile.stemLengthP50 > 40);
    assert.ok(profile.stemLengthP90 >= profile.stemLengthP50);
    assert.ok(profile.passageRate > 0 && profile.passageRate < 0.3);
    assert.ok(profile.negativeStemRate > 0);
    assert.equal(profile.certoErrado, true);
    assert.ok(profile.commandVerbs.length >= 1);
    assert.ok(profile.difficultyProxy >= 0 && profile.difficultyProxy <= 1);
  });
});
