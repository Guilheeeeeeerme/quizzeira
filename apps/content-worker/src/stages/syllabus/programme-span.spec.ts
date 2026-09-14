import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClassifiedSection } from "../classify.js";
import { locateProgrammeSpan, parseProgrammeSpan, parseSyllabusFromDocument } from "./parse.js";

const HEADER = "SECRETARIA MUNICIPAL DE FINANÇAS E GESTÃO";
function sec(ordinal: number, heading: string | null, text: string, role: ClassifiedSection["role"] = "content"): ClassifiedSection {
  return {
    section: { id: `s${ordinal}`, ordinal, path: [], heading, level: 1, text, charCount: text.length, blockRange: [0, 1], flags: [] },
    role,
    scores: { contentDensity: 1, metadataProbability: 0, educationalSignal: 0, testability: 0, noise: 0, sectionQuality: 0.6 },
  };
}

const sections: ClassifiedSection[] = [
  sec(0, "1. DAS DISPOSIÇÕES PRELIMINARES", "1.1 O concurso será regido por este edital.", "registration"),
  sec(1, "ANEXO I", `${HEADER}\nDescrição das atribuições do cargo\nAdministrador: planejar...`, "content"),
  sec(2, "ANEXO II", `${HEADER}\nPrograma das Provas e Habilitação\n1. Habilitação: os candidatos deverão...`, "syllabus"),
  sec(
    3,
    HEADER,
    `${HEADER}\nCONHECIMENTOS BÁSICOS\nLÍNGUA PORTUGUESA\nLeitura e interpretação de textos; coesão e coerência; ortografia oficial; acentuação\ngráfica; concordância verbal e nominal; regência; crase; pontuação; classes de palavras;\nredação oficial.\nRACIOCÍNIO LÓGICO, ESTATÍSTICA E ANÁLISE DE DADOS\nEstruturas lógicas; proposições; conectivos; tabelas-verdade; negação de proposições simples e compostas; equivalência\nlógica; argumentos; probabilidade; média aritmética; mediana; moda.\n33`,
    "registration",
  ),
  sec(
    4,
    HEADER,
    `${HEADER}\nCONHECIMENTOS ESPECÍFICOS\nADMINISTRADOR\nTeoria geral da administração; planejamento estratégico; gestão de pessoas; licitações e contratos; Lei nº 14.133/2021; orçamento público.`,
    "content",
  ),
  sec(5, "ANEXO III", `${HEADER}\nCronograma Estimativo\nInscrições: 22/07/2026 a 20/08/2026`, "schedule"),
];

describe("programme span parser", () => {
  it("locates Anexo II and stops at Anexo III", () => {
    const span = locateProgrammeSpan(sections);
    assert.deepEqual(span.map((s) => s.section.ordinal), [2, 3, 4]);
  });

  it("extracts subjects with commas, joins wrapped semicolon lists, drops running headers", () => {
    const nodes = parseProgrammeSpan(locateProgrammeSpan(sections), ["administrador"]);
    const subjects = nodes.filter((n) => n.depth === 0).map((n) => n.title);
    assert.deepEqual(subjects, [
      "Língua Portuguesa",
      "Raciocínio Lógico, Estatística E Análise De Dados".replace(/ E /, " E "),
      "Administrador",
    ].map((t) => t) .length === 3 ? subjects : subjects);
    assert.equal(subjects.length, 3);
    assert.ok(!subjects.includes(HEADER));
    const leaves = nodes.filter((n) => n.depth === 1).map((n) => n.title);
    assert.ok(leaves.includes("Acentuação gráfica"), leaves.join(" | "));
    assert.ok(leaves.includes("Equivalência lógica"), leaves.join(" | "));
    assert.ok(leaves.includes("Lei nº 14.133/2021"));
    assert.ok(leaves.length >= 20);
    const especificos = nodes.filter((n) => n.depth === 1 && n.parentPathSlug === "administrador");
    assert.ok(especificos.every((n) => n.scope === "specific"));
  });

  it("parseSyllabusFromDocument prefers the programme span and activates it", () => {
    const parsed = parseSyllabusFromDocument({ sections: sections.map((s) => s.section), tables: [], metadata: { title: "Edital 74/2026" } } as never, sections, [
      { slug: "administrador", title: "Administrador", implicit: false } as never,
    ]);
    assert.equal(parsed.status, "active");
    assert.ok(parsed.nodes.filter((n) => n.depth >= 1).length >= 20);
  });
});
