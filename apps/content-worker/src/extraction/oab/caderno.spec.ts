import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBookletType, parseCadernoText, stripPerceptionQuestionnaire } from "./caderno";

/** Booklet text as the layout reader hands it over: one line per printed line. */
function booklet(questions: number, options: (n: number) => string[]): string {
  const lines = ["TIPO 1 – BRANCA", "46º EXAME DE ORDEM UNIFICADO"];
  for (let n = 1; n <= questions; n += 1) {
    lines.push(String(n));
    lines.push(`Enunciado da questão número ${n}, com texto suficiente para valer.`);
    for (const option of options(n)) lines.push(option);
  }
  return lines.join("\n");
}

const parenOptions = (n: number) => [
  `(A) alternativa A da ${n}`,
  `(B) alternativa B da ${n}`,
  `(C) alternativa C da ${n}`,
  `(D) alternativa D da ${n}`,
];

describe("parseBookletType", () => {
  it("reads the type off the cover", () => {
    assert.equal(parseBookletType("TIPO 1 – BRANCA\n46º EXAME"), 1);
    assert.equal(parseBookletType("Tipo 3"), 3);
  });

  it("returns null when the cover is unreadable", () => {
    assert.equal(parseBookletType("46º EXAME DE ORDEM UNIFICADO"), null);
    assert.equal(parseBookletType("Tipo 9"), null);
  });
});

describe("stripPerceptionQuestionnaire", () => {
  it("cuts the trailing questionnaire", () => {
    const text = `${"questão real ".repeat(40)}\nQuestionário de percepção sobre a prova\n1\nComo você avalia…`;
    const stripped = stripPerceptionQuestionnaire(text);
    assert.ok(!stripped.includes("Como você avalia"));
  });

  it("ignores the mention in the cover instructions", () => {
    const text = `Esta prova contém 80 questões e o questionário de percepção sobre a prova.\n${"corpo da prova ".repeat(60)}`;
    assert.equal(stripPerceptionQuestionnaire(text), text);
  });
});

describe("parseCadernoText", () => {
  it("recovers all 80 questions with four options each", () => {
    const result = parseCadernoText(booklet(80, parenOptions));
    assert.equal(result.questions.length, 80);
    assert.equal(result.missing.length, 0);
    assert.equal(result.bookletType, 1);
    assert.equal(result.questions[0].number, 1);
    assert.equal(result.questions[79].options.length, 4);
  });

  it("accepts the older 'A)' option marker", () => {
    const result = parseCadernoText(
      booklet(3, (n) => [`A) primeira ${n}`, `B) segunda ${n}`, `C) terceira ${n}`, `D) quarta ${n}`]),
    );
    assert.equal(result.questions.length, 3);
    assert.equal(result.questions[0].options[0], "primeira 1");
  });

  it("does not mistake a page folio for a question header", () => {
    const text = booklet(3, parenOptions).replace(
      "(D) alternativa D da 1",
      "(D) alternativa D da 1\n15\nTipo Branca – Página 15",
    );
    const result = parseCadernoText(text);
    assert.equal(result.questions.length, 3);
    assert.deepEqual(
      result.questions.map((q) => q.number),
      [1, 2, 3],
    );
  });

  it("reports a question whose options did not parse instead of dropping it", () => {
    const text = booklet(3, parenOptions).replace("(C) alternativa C da 2\n", "");
    const result = parseCadernoText(text);
    assert.deepEqual(result.missing, [2]);
    assert.equal(result.questions.length, 2);
  });

  it("keeps accents intact", () => {
    const result = parseCadernoText(
      [
        "TIPO 1",
        "1",
        "Segundo o Código de Ética e Disciplina, é correto afirmar que a inscrição…",
        "(A) não é exigível",
        "(B) é exigível",
        "(C) depende da seccional",
        "(D) cabe ao órgão julgador",
      ].join("\n"),
    );
    assert.match(result.questions[0].prompt, /Código de Ética/);
    assert.equal(result.questions[0].options[3], "cabe ao órgão julgador");
  });
});
