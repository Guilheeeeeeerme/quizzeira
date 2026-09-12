import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { oabEditionByNumber } from "@quizzeira/shared";
import { groupByExam, parseEditionDocuments } from "./oab-fgv";

const BASE = "https://oab.fgv.br/home.aspx?key=649";

function anchor(label: string, href: string): string {
  return `<li><a href="${href}">${label}</a></li>`;
}

const PAGE = [
  "<html><body>",
  anchor("Edital de abertura", "http://oab.fgv.br/arq/649/100_edital.pdf"),
  anchor("Edital - Locais de Prova (1ª fase)", "http://oab.fgv.br/arq/649/101_locais.pdf"),
  anchor("Caderno de Prova - Tipo 1 - Branca", "http://oab.fgv.br/arq/649/102_tipo1.pdf"),
  anchor("Caderno de Prova - Tipo 2", "http://oab.fgv.br/arq/649/103_tipo2.pdf"),
  anchor("Gabaritos Preliminares da Prova Objetiva (1ª Fase)", "http://oab.fgv.br/arq/649/104_prelim.pdf"),
  anchor("Gabaritos definitivos da prova objetiva (1ª fase)", "http://oab.fgv.br/arq/649/105_def.pdf"),
  anchor("Caderno de Provas (Direito Civil)", "http://oab.fgv.br/arq/649/106_b002.pdf"),
  anchor("Padrão de respostas definitivo (Direito Civil)", "http://oab.fgv.br/arq/649/107_b002.pdf"),
  anchor("Resultado preliminar da 2ª fase", "http://oab.fgv.br/arq/649/108_resultado.pdf"),
  anchor("Conselho Federal da OAB", "https://www.oab.org.br/"),
  anchor("Provimento 144/2011 em PDF", "https://www.oab.org.br/prov144.pdf"),
  "</body></html>",
].join("\n");

describe("parseEditionDocuments", () => {
  it("keeps the exam documents and drops the administrative rows", () => {
    const labels = parseEditionDocuments(PAGE, BASE).map((d) => d.label);
    assert.ok(labels.includes("Edital de abertura"));
    assert.ok(!labels.some((l) => /Locais de Prova|Resultado/.test(l)));
  });

  it("keeps only FGV-hosted PDFs", () => {
    const urls = parseEditionDocuments(PAGE, BASE).map((d) => d.url);
    assert.ok(urls.every((u) => u.includes("oab.fgv.br")));
    assert.ok(!urls.some((u) => u.includes("prov144")));
  });

  it("upgrades FGV's plain-http artifact URLs", () => {
    assert.ok(parseEditionDocuments(PAGE, BASE).every((d) => d.url.startsWith("https://")));
  });

  it("drops the preliminary gabarito in favour of the definitive one", () => {
    const gabaritos = parseEditionDocuments(PAGE, BASE).filter(
      (d) => d.kind === "gabarito" && d.phase === "objective",
    );
    assert.equal(gabaritos.length, 1);
    assert.equal(gabaritos[0].definitive, true);
  });

  it("returns nothing for the pre-postback page, which has no document list", () => {
    assert.deepEqual(parseEditionDocuments("<html><body><select></select></body></html>", BASE), []);
  });
});

describe("groupByExam", () => {
  const edition = oabEditionByNumber(46);

  it("splits the two papers into two exams", () => {
    assert.ok(edition);
    const groups = groupByExam(edition, parseEditionDocuments(PAGE, BASE));
    const bySlug = new Map(groups.map((g) => [g.examSlug, g]));
    assert.deepEqual([...bySlug.keys()].sort(), ["oab-46-1-fase", "oab-46-2-fase"]);
    assert.equal(bySlug.get("oab-46-2-fase")?.documents.length, 2);
  });

  it("files the edital with the 1ª fase, which every candidate sits", () => {
    assert.ok(edition);
    const groups = groupByExam(edition, parseEditionDocuments(PAGE, BASE));
    const objective = groups.find((g) => g.phase === "objective");
    assert.ok(objective?.documents.some((d) => d.kind === "edital"));
  });
});
