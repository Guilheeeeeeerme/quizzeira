import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  crawlerSourceId,
  domainFromUrl,
  inferExamKind,
  listingsFingerprint,
  looksLikelyOpen,
  looksOpen,
  normalizeOpenExam,
  openExamFingerprint,
  parseRegistrationWindow,
} from "./crawler.js";

describe("normalizeOpenExam", () => {
  it("builds slug from org + banca and marks open listings", () => {
    const rec = normalizeOpenExam({
      title: "Transpetro – PSP Terra – Inscrições abertas – Cesgranrio – Administração",
      href: "https://www.cesgranrio.org.br/concursos/evento/edital.pdf",
      sourceId: "src1",
      sourceDomain: "cesgranrio.org.br",
    });
    assert.match(rec.examSlug, /transpetro/);
    assert.match(rec.examSlug, /cesgranrio/);
    assert.equal(rec.status, "open");
    assert.ok(rec.emphasis.some((e) => /administra/i.test(e)));
    assert.ok(rec.editalUrl?.endsWith(".pdf"));
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
  });

  it("does not slug org-nav pages as the org alone", () => {
    const rec = normalizeOpenExam({
      title: "Ouvidoria",
      href: "https://transpetro.com.br/transpetro-institucional/ouvidoria.htm",
      sourceId: "src1",
      sourceDomain: "transpetro.com.br",
    });
    assert.equal(rec.examSlug, "ouvidoria");
    assert.notEqual(rec.examSlug, "transpetro");
  });
  it("falls back to title slug when org unknown", () => {
    const rec = normalizeOpenExam({
      title: "Concurso Prefeitura Exemplo 2026",
      href: "https://portal.exemplo.gov.br/concursos/1",
      sourceId: "src2",
      sourceDomain: "portal.exemplo.gov.br",
    });
    assert.match(rec.examSlug, /prefeitura|exemplo/);
  });
});

describe("parseRegistrationWindow", () => {
  it("parses de/até date ranges", () => {
    const window = parseRegistrationWindow(
      "Inscrições de 01/03/2026 a 30/03/2026 para o concurso público.",
    );
    assert.ok(window);
    assert.equal(window!.start, "2026-03-01");
    assert.equal(window!.end, "2026-03-30");
  });

  it("parses inscrições abertas até", () => {
    const window = parseRegistrationWindow("Inscrições abertas até 15/04/2026");
    assert.ok(window);
    assert.equal(window!.end, "2026-04-15");
  });

  it("returns null when no dates found", () => {
    assert.equal(parseRegistrationWindow("Resultado final homologado"), null);
  });
});

describe("normalizeOpenExam registration status", () => {
  it("uses registration dates over regex open hint when past", () => {
    const rec = normalizeOpenExam({
      title: "TCE-GO — Inscrições abertas",
      href: "https://portal.example.gov.br/concurso/tce-go-2020/",
      sourceId: "src1",
      sourceDomain: "portal.example.gov.br",
      detailText: "Inscrições de 01/01/2020 a 31/01/2020",
    });
    assert.equal(rec.status, "unknown");
    assert.equal(rec.statusSource, "date");
    assert.equal(rec.registrationEnd, "2020-01-31");
  });
});

describe("exam kind", () => {
  it("classifies non-concurso titles", () => {
    assert.equal(inferExamKind("54º Exame para Certificação — CFP®"), "other");
    assert.equal(inferExamKind("Concurso Público TCE-GO"), "concurso");
  });
});

describe("crawler helpers", () => {
  it("detects open copy and domains", () => {
    assert.equal(looksLikelyOpen("Inscrições abertas até 30/09"), true);
    assert.equal(looksOpen("Inscrições abertas até 30/09"), true);
    assert.equal(looksLikelyOpen("Concurso Público para a Prefeitura"), true);
    assert.equal(looksLikelyOpen("01- Edital de Abertura"), true);
    assert.equal(looksLikelyOpen("Resultado final homologado"), false);
    assert.equal(domainFromUrl("https://www.FCC.org.br/path"), "fcc.org.br");
    assert.equal(crawlerSourceId("a.com", "A"), crawlerSourceId("a.com", "A"));
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
