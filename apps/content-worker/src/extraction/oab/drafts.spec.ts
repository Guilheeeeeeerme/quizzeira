import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CadernoParseResult } from "./caderno";
import { objectiveDrafts, practicalDrafts } from "./drafts";
import type { GabaritoParseResult } from "./gabarito";
import type { PadraoParseResult } from "./padrao";

function caderno(numbers: number[], bookletType: number | null = 1): CadernoParseResult {
  return {
    bookletType,
    missing: [],
    questions: numbers.map((number) => ({
      number,
      prompt: `Enunciado da questão ${number}`,
      options: ["A", "B", "C", "D"].map((l) => `alternativa ${l} da ${number}`),
    })),
  };
}

function gabarito(
  answers: Array<[number, number]>,
  options: { bookletType?: number; correspondence?: Array<[number, number]> } = {},
): GabaritoParseResult {
  const type = options.bookletType ?? 1;
  const correspondence = new Map<number, Map<number, number>>();
  for (const [tipo1, inBooklet] of options.correspondence ?? []) {
    correspondence.set(tipo1, new Map([[1, tipo1], [type, inBooklet]]));
  }
  return {
    answersByType: new Map([[type, new Map(answers)]]),
    correspondence,
    definitive: true,
  };
}

describe("objectiveDrafts", () => {
  it("pairs each question with its key and labels it by the blueprint", () => {
    const { groups } = objectiveDrafts(
      caderno([1, 37]),
      gabarito([
        [1, 2],
        [37, 0],
      ]),
    );
    const bySlug = new Map(groups.map((g) => [g.subjectSlug, g]));
    assert.deepEqual([...bySlug.keys()].sort(), ["direito-civil", "etica-profissional"]);
    assert.equal(bySlug.get("etica-profissional")?.questions[0].correctIndex, 2);
    assert.equal(bySlug.get("direito-civil")?.questions[0].type, "MULTIPLE_CHOICE");
  });

  it("re-keys a Tipo 3 booklet to Tipo 1 numbering", () => {
    // Tipo 3's question 12 is Tipo 1's question 37 — Direito Civil, answer B.
    const { groups } = objectiveDrafts(
      caderno([12], 3),
      gabarito([[12, 1]], { bookletType: 3, correspondence: [[37, 12]] }),
    );
    assert.equal(groups.length, 1);
    assert.equal(groups[0].subjectSlug, "direito-civil");
    assert.equal(groups[0].questions[0].correctIndex, 1);
  });

  it("drafts nothing from a non-canonical booklet with no correspondence table", () => {
    const result = objectiveDrafts(caderno([12], 3), gabarito([[12, 1]], { bookletType: 3 }));
    assert.deepEqual(result.groups, []);
  });

  it("drafts nothing when the booklet type is unknown", () => {
    assert.deepEqual(objectiveDrafts(caderno([1], null), gabarito([[1, 0]])).groups, []);
  });

  it("drops a question the definitive key no longer lists", () => {
    const result = objectiveDrafts(caderno([1, 2]), gabarito([[1, 0]]));
    assert.deepEqual(result.annulled, [2]);
    assert.equal(result.groups[0].questions.length, 1);
  });
});

describe("practicalDrafts", () => {
  const enunciado =
    "Determinado cliente procura advogado após ser citado em ação de cobrança e pede providências.";
  const padrao = (items: PadraoParseResult["items"]): PadraoParseResult => ({
    items,
    area: { code: "B002", name: "Direito Civil", slug: "direito-civil" },
    definitive: true,
  });

  it("files the whole paper under its área", () => {
    const groups = practicalDrafts(
      padrao([
        { kind: "peca", number: null, enunciado, answer: "Modelo da peça.", value: 5 },
        { kind: "questao", number: 1, enunciado, answer: "Modelo da questão.", value: 1.25 },
      ]),
    );
    assert.equal(groups.length, 1);
    assert.equal(groups[0].subjectSlug, "direito-civil");
    assert.equal(groups[0].questions.length, 2);
  });

  it("keeps the banca's model answer as the reference answer", () => {
    const [group] = practicalDrafts(
      padrao([{ kind: "peca", number: null, enunciado, answer: "Modelo da peça.", value: 5 }]),
    );
    assert.equal(group.questions[0].type, "OPEN");
    assert.equal(group.questions[0].referenceAnswer, "Modelo da peça.");
    assert.match(group.questions[0].prompt, /^Peça prático-profissional \(Valor: 5,00\)/);
  });

  it("skips an item whose enunciado is only in the caderno", () => {
    const groups = practicalDrafts(
      padrao([{ kind: "questao", number: 2, enunciado: "", answer: "Modelo.", value: 1.25 }]),
    );
    assert.deepEqual(groups, []);
  });
});
