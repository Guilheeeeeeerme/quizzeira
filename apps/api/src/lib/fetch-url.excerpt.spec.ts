import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  excerptMaterialForGeneration,
  excerptStudyContext,
  excerptText,
} from "./fetch-url.js";

describe("excerptStudyContext", () => {
  it("keeps short texts intact", () => {
    assert.equal(excerptStudyContext("abc"), "abc");
  });

  it("prefers conteúdo programático over edital head", () => {
    const head = "Edital admin ".repeat(400);
    const syllabus =
      "ANEXO IV - CONTEÚDOS PROGRAMÁTICOS\nLÍNGUA PORTUGUESA: compreensão de textos.\nADMINISTRAÇÃO FINANCEIRA.";
    const full = `${head}\n${syllabus}\n${"tail padding ".repeat(200)}`;
    const out = excerptStudyContext(full, 4_000)!;
    assert.match(out, /CONTEÚDOS PROGRAMÁTICOS|LÍNGUA PORTUGUESA/);
    assert.match(out, /LÍNGUA PORTUGUESA|ADMINISTRAÇÃO FINANCEIRA/);
    assert.ok(out.length <= 4_000 + 50);
  });

  it("ignores early TOC 'Conhecimentos Específicos' in favor of LÍNGUA PORTUGUESA body", () => {
    const toc =
      "1 Das disposições\n2 Conhecimentos Específicos e Conhecimentos Gerais constam do Anexo IV.\n" +
      "3 Inscrições e taxas.\n";
    const pad = "norma administrativa PcD CLT ".repeat(2_000);
    const body =
      "ANEXO IV - CONTEÚDOS PROGRAMÁTICOS\nLÍNGUA PORTUGUESA: 1. Compreensão de textos.\n" +
      "CONHECIMENTOS ESPECÍFICOS ÊNFASE 1: ADMINISTRAÇÃO\nADMINISTRAÇÃO FINANCEIRA E ORÇAMENTÁRIA: NPV, ROI.\n";
    const full = toc + pad + body + "fim ".repeat(500);
    const out = excerptStudyContext(full, 6_000)!;
    assert.match(out, /LÍNGUA PORTUGUESA/);
    assert.match(out, /ADMINISTRAÇÃO FINANCEIRA/);
    // Head may keep a short admin prefix; syllabus body must dominate.
    const syllabusIdx = out.indexOf("LÍNGUA PORTUGUESA");
    assert.ok(syllabusIdx > 0);
    assert.ok(out.length - syllabusIdx > syllabusIdx);
  });

  it("plain excerptText still truncates from the start", () => {
    const text = "HEAD" + "x".repeat(10_000);
    assert.equal(excerptText(text, 10), "HEAD" + "x".repeat(6));
  });
});

describe("excerptMaterialForGeneration", () => {
  it("hard-truncates quadro de vagas so it cannot drown syllabus", () => {
    const table =
      "ANEXO I - QUADRO DE ÊNFASES, POLOS DE TRABALHO, VAGAS E CADASTRO DE RESERVA\n" +
      "QUADRO 1 - VAGAS\nÊNFASES POLOS AC PCD\n1 - ADMINISTRAÇÃO RIO DE JANEIRO 3 0\n" +
      "more vacancy rows ".repeat(400);
    const out = excerptMaterialForGeneration(table, {
      filename: "Quadro Vagas_Edital.pdf",
    })!;
    assert.ok(out.length < 2_000);
    assert.match(out, /vacancy \/ ênfase table truncated/i);
  });
});
