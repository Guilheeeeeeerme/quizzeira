import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GeneratedQuestionInput } from "./types.js";
import {
  bankExamIndexKey,
  bankItemId,
  bankSubjectIndexKey,
  hashSourceUrl,
  preferBankOverColdGen,
  slugifyKey,
} from "./question-bank.js";

function q(prompt: string): GeneratedQuestionInput {
  return {
    type: "MULTIPLE_CHOICE",
    prompt,
    options: ["A", "B", "C", "D"],
    correctIndex: 0,
    referenceAnswer: null,
    explanation: null,
  };
}

describe("question-bank keys", () => {
  it("slugifies exam / subject identity", () => {
    assert.equal(slugifyKey("Transpetro / Cesgranrio"), "transpetro-cesgranrio");
    assert.equal(slugifyKey("Administração Financeira"), "administracao-financeira");
    assert.equal(bankExamIndexKey("Transpetro"), "qbank:exam:transpetro");
    assert.equal(
      bankSubjectIndexKey("transpetro", "Língua Portuguesa"),
      "qbank:idx:transpetro:lingua-portuguesa",
    );
  });

  it("stable item ids and source url hashes", () => {
    const a = bankItemId({
      examSlug: "transpetro",
      subjectSlug: "administracao",
      prompt: "O que é ROI?",
      options: ["A", "B"],
    });
    const b = bankItemId({
      examSlug: "transpetro",
      subjectSlug: "administracao",
      prompt: "O que é ROI?",
      options: ["A", "B"],
    });
    assert.equal(a, b);
    assert.equal(hashSourceUrl("https://example.com/prova.pdf"), hashSourceUrl("https://example.com/prova.pdf"));
  });
});

describe("preferBankOverColdGen", () => {
  it("uses bank only when hits cover min budget", () => {
    const bank = [q("b1"), q("b2"), q("b3"), q("b4")];
    const cold = [q("c1"), q("c2")];
    const result = preferBankOverColdGen(bank, cold, { minQuestions: 3, maxQuestions: 6 });
    assert.equal(result.fromBank, 4);
    assert.equal(result.fromCold, 0);
    assert.deepEqual(
      result.questions.map((x) => x.prompt),
      ["b1", "b2", "b3", "b4"],
    );
  });

  it("fills gaps with cold gen when bank is short", () => {
    const bank = [q("b1")];
    const cold = [q("c1"), q("c2"), q("c3")];
    const result = preferBankOverColdGen(bank, cold, { minQuestions: 3, maxQuestions: 4 });
    assert.equal(result.fromBank, 1);
    assert.equal(result.fromCold, 3);
    assert.deepEqual(
      result.questions.map((x) => x.prompt),
      ["b1", "c1", "c2", "c3"],
    );
  });

  it("caps at maxQuestions", () => {
    const bank = [q("b1"), q("b2"), q("b3"), q("b4"), q("b5")];
    const result = preferBankOverColdGen(bank, [q("c1")], { minQuestions: 3, maxQuestions: 3 });
    assert.equal(result.questions.length, 3);
    assert.equal(result.fromCold, 0);
  });
});
