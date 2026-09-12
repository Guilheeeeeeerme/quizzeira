import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSyllabusFromSections } from "./parse.js";

describe("parseSyllabusFromSections", () => {
  it("parses outline subjects and items", () => {
    const parsed = parseSyllabusFromSections(
      [
        {
          heading: "Anexo II — Conteúdo Programático",
          role: "syllabus",
          text: [
            "CONHECIMENTOS BÁSICOS",
            "LÍNGUA PORTUGUESA:",
            "1. Compreensão e interpretação de textos.",
            "2. Ortografia oficial.",
            "3. Concordância verbal e nominal.",
            "RACIOCÍNIO LÓGICO:",
            "1. Proposições.",
            "2. Negação.",
          ].join("\n"),
        },
      ],
      { title: "Concurso TCE para o cargo de Analista" },
    );
    assert.equal(parsed.status, "active");
    assert.ok(parsed.nodes.some((n) => /Portuguesa|PORTUGUESA|Língua/i.test(n.title)));
    assert.ok(parsed.nodes.some((n) => /Concordância|concordancia/i.test(n.title)));
    assert.ok(parsed.positions.length >= 1);
  });

  it("drops administrative syllabus lines", () => {
    const parsed = parseSyllabusFromSections([
      {
        heading: "Programa",
        role: "syllabus",
        text: "LÍNGUA PORTUGUESA:\n1. Ortografia.\n2. Quantas vagas são oferecidas.\n3. Taxa de inscrição.",
      },
    ]);
    assert.ok(!parsed.nodes.some((n) => /vagas|taxa/i.test(n.title)));
  });
});
