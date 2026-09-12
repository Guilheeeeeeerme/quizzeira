import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyExamKind,
  crawlerSourceId,
  domainFromUrl,
  extractEditionKey,
  extractPositionsFromText,
  isRegistrationOpen,
  kindHintFromLabel,
  listingsFingerprint,
  looksLikelyOpen,
  normalizeOpenExam,
  openExamFingerprint,
  parseRegistrationWindow,
  roleHintFromKind,
} from "./crawler.js";

describe("normalizeOpenExam", () => {
  it("builds identity from org + edition and marks likely-open concursos open", () => {
    const rec = normalizeOpenExam({
      title: "Transpetro – PSP Terra – Inscrições abertas – Cesgranrio – Edital nº 01/2026",
      href: "https://www.cesgranrio.org.br/concursos/evento/edital.pdf",
      sourceId: "src1",
      sourceDomain: "cesgranrio.org.br",
    });
    assert.match(rec.examSlug, /transpetro/);
    assert.equal(rec.editionKey, "edital-01-2026");
    assert.equal(rec.kind, "concurso");
    assert.equal(rec.status, "open");
    assert.equal(rec.statusSource, "regex");
    assert.ok(rec.editalUrl?.endsWith(".pdf"));
    assert.equal(rec.detailUrl, null);
  });

  it("uses /concurso/ path slug instead of collapsing to org", () => {
    const rec = normalizeOpenExam({
      title: "Transpetro 2026",
      href: "https://www.cesgranrio.org.br/concurso/transpetro-2026/",
      sourceId: "src1",
      sourceDomain: "cesgranrio.org.br",
    });
    assert.equal(rec.examSlug, "transpetro-2026");
    assert.equal(rec.status, "open");
    assert.equal(rec.detailUrl, "https://www.cesgranrio.org.br/concurso/transpetro-2026/");
  });

  it("never uses anchor text as the slug and never collapses to the org alone", () => {
    const rec = normalizeOpenExam({
      title: "Ouvidoria",
      href: "https://transpetro.com.br/transpetro-institucional/ouvidoria.htm",
      sourceId: "src1",
      sourceDomain: "transpetro.com.br",
    });
    assert.notEqual(rec.examSlug, "ouvidoria");
    assert.notEqual(rec.examSlug, "transpetro");
    assert.match(rec.examSlug, /^transpetro-[0-9a-f]{8}$/);
    assert.equal(rec.status, "unknown");
  });

  it("does not treat a numeric path segment as an exam identity", () => {
    const rec = normalizeOpenExam({
      title: "Concurso Prefeitura Exemplo 2026",
      href: "https://portal.exemplo.gov.br/concursos/1",
      sourceId: "src2",
      sourceDomain: "portal.exemplo.gov.br",
    });
    assert.notEqual(rec.examSlug, "1");
    assert.match(rec.examSlug, /prefeitura|exemplo/);
    assert.match(rec.examSlug, /2026$/);
  });

  it("keeps non-concurso listings out of the open catalog (REG-002 / REG-006)", () => {
    const rec = normalizeOpenExam({
      title: "PLANEJAR – 54º Exame para Certificação CFP® – Inscrições abertas",
      href: "https://www.planejar.org.br/certificacao/54-exame/",
      sourceId: "src3",
      sourceDomain: "planejar.org.br",
    });
    assert.equal(rec.kind, "certification");
    assert.equal(rec.status, "unknown");
  });
});

describe("crawler helpers", () => {
  it("detects likely-open copy and domains", () => {
    assert.equal(looksLikelyOpen("Inscrições abertas até 30/09"), true);
    assert.equal(looksLikelyOpen("Concurso Público para a Prefeitura"), true);
    assert.equal(looksLikelyOpen("01- Edital de Abertura"), true);
    assert.equal(looksLikelyOpen("Resultado final homologado"), false);
    assert.equal(domainFromUrl("https://www.FCC.org.br/path"), "fcc.org.br");
    assert.equal(crawlerSourceId("a.com", "A"), crawlerSourceId("a.com", "A"));
  });

  it("parses registration windows in the common edital phrasings", () => {
    assert.deepEqual(
      parseRegistrationWindow("As inscrições serão realizadas de 10/03/2026 a 25/03/2026."),
      { start: "2026-03-10", end: "2026-03-25" },
    );
    assert.deepEqual(
      parseRegistrationWindow("Inscrições até 25 de março de 2026 pelo site."),
      { start: null, end: "2026-03-25" },
    );
    assert.deepEqual(
      parseRegistrationWindow("Período de inscrições: 1º de abril de 2026 até 30 de abril de 2026"),
      { start: "2026-04-01", end: "2026-04-30" },
    );
    assert.equal(parseRegistrationWindow("Inscrições abertas em breve"), null);
    assert.equal(isRegistrationOpen({ start: null, end: "2026-09-30" }, new Date("2026-09-12")), true);
    assert.equal(isRegistrationOpen({ start: null, end: "2026-09-01" }, new Date("2026-09-12")), false);
    assert.equal(isRegistrationOpen(null), false);
  });

  it("classifies exam kind with the non-concurso filter", () => {
    assert.equal(classifyExamKind("TCE-GO – Técnico de Controle Externo – Concurso Público"), "concurso");
    assert.equal(classifyExamKind("54º Exame para Certificação – CFP®"), "certification");
    assert.equal(classifyExamKind("Vestibular 2027 – 1ª fase"), "vestibular");
    assert.equal(classifyExamKind("Exame de Ordem Unificado – OAB"), "oab");
    assert.equal(classifyExamKind("Processo Seletivo para ingresso no Mestrado em Direito"), "other");
    assert.equal(classifyExamKind("Concurso Público – Residência Médica – Edital 03/2026"), "concurso");
  });

  it("extracts edition keys and positions", () => {
    assert.equal(extractEditionKey("Edital nº 01/2026 – Abertura"), "edital-01-2026");
    assert.equal(extractEditionKey("Edital de Abertura n. 12/2025"), "edital-12-2025");
    assert.equal(extractEditionKey("54º Exame 2026"), "54-2026");
    assert.equal(extractEditionKey("Concurso TCE-GO 2026"), "2026");
    assert.equal(extractEditionKey("Ouvidoria"), null);
    assert.deepEqual(
      extractPositionsFromText("Concurso para os cargos de Analista de Sistemas, Técnico de Controle Externo e Auditor."),
      ["Analista de Sistemas", "Técnico de Controle Externo", "Auditor"],
    );
  });

  it("maps anchor labels to kind and role hints", () => {
    assert.equal(kindHintFromLabel("Edital de Abertura", "/docs/edital_01.pdf"), "edital");
    assert.equal(kindHintFromLabel("Retificação nº 1", "/docs/ret.pdf"), "retificacao");
    assert.equal(kindHintFromLabel("Caderno de Questões – Tipo 1", "/x.pdf"), "prova");
    assert.equal(kindHintFromLabel("Gabarito Preliminar", "/x.pdf"), "gabarito");
    assert.equal(kindHintFromLabel("Conteúdo Programático", "/anexo-ii.pdf"), "programa");
    assert.equal(kindHintFromLabel("Lei nº 14.133/2021", "/ccivil_03/lei.htm"), "lei");
    assert.equal(kindHintFromLabel("Voltar", "/"), "unknown");
    assert.equal(roleHintFromKind("edital"), "specification");
    assert.equal(roleHintFromKind("gabarito"), "evidence");
    assert.equal(roleHintFromKind("apostila"), "knowledge");
    assert.equal(roleHintFromKind("listing"), "administrative");
    assert.equal(roleHintFromKind("unknown"), "unknown");
  });

  it("fingerprints open exams and listings stably", () => {
    const base = normalizeOpenExam({
      title: "Transpetro – Inscrições abertas – Cesgranrio",
      href: "https://www.cesgranrio.org.br/concursos/evento/1",
      sourceId: "src1",
      sourceDomain: "cesgranrio.org.br",
    });
    assert.equal(openExamFingerprint(base), openExamFingerprint({ ...base }));
    assert.notEqual(
      openExamFingerprint(base),
      openExamFingerprint({ ...base, title: `${base.title} (retificação)` }),
    );
    assert.equal(
      listingsFingerprint([
        { title: "B", href: "https://a/b" },
        { title: "A", href: "https://a/a" },
      ]),
      listingsFingerprint([
        { title: "A", href: "https://a/a" },
        { title: "B", href: "https://a/b" },
      ]),
    );
  });
});
