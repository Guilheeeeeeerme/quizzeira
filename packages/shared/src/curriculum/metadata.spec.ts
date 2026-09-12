import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyDocumentRole,
  classifyExamKind,
  isConcursoEligible,
  metadataProbability,
  normalizeHtmlDocument,
  scoreSection,
  testsSyllabusMeta,
} from "../index";

describe("metadata classifier", () => {
  it("flags listing trivia / registration copy", () => {
    const text =
      "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para o cargo de Técnico. " +
      "Taxa de inscrição R$ 80,00. Vagas: 10. Cronograma e local de prova no edital n° 01/2026.";
    assert.ok(metadataProbability(text) > 0.5);
  });

  it("keeps educational grammar content low-metadata", () => {
    const text =
      "Define-se concordância verbal como a relação de harmonia entre o verbo e o sujeito. " +
      "Por exemplo: chegaram o pai e o filho. A regra geral exige o plural com sujeito composto anteposto.";
    assert.ok(metadataProbability(text) < 0.45);
  });

  it("detects syllabus-meta stems", () => {
    assert.ok(
      testsSyllabusMeta("Quais assuntos de Língua Portuguesa constam no conteúdo programático?"),
    );
  });
});

describe("role classifier", () => {
  it("classifies listing pages as administrative via provenance", () => {
    const html =
      `<html><body><h1>Concursos</h1><a href="/a">TCE-GO inscrições abertas</a><p>Saiba mais</p></body></html>`;
    const { text } = normalizeHtmlDocument(html);
    const role = classifyDocumentRole({
      url: "https://portal.example/concursos",
      kindHint: "listing",
      roleHint: "administrative",
      text,
    });
    assert.equal(role.role, "administrative");
    assert.ok(role.confidence >= 0.75);
  });
});

describe("exam kind filter", () => {
  it("rejects certification listings", () => {
    const kind = classifyExamKind("54º Exame para Certificação — CFP®", "/certificacao/cfp");
    assert.equal(kind, "certification");
    assert.equal(isConcursoEligible(kind), false);
  });

  it("keeps concurso listings", () => {
    const kind = classifyExamKind(
      "TCE-GO — Técnico — edital de abertura 2026",
      "/concurso/tce-go-2026/",
    );
    assert.equal(kind, "concurso");
    assert.ok(isConcursoEligible(kind));
  });
});

describe("section scoring", () => {
  it("scores educational prose with low metadata", () => {
    const text =
      "A concordância verbal exige que o verbo concorde com o sujeito. " +
      "Por exemplo, com sujeito composto anteposto, o verbo vai para o plural. " +
      "Define-se esta regra na norma-padrão da língua portuguesa contemporânea.";
    const scores = scoreSection(text);
    assert.ok(scores.sectionQuality >= 0.3);
    assert.ok(scores.metadataProbability < 0.5);
  });
});
