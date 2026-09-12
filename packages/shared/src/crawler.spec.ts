import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  crawlerSourceId,
  domainFromUrl,
  listingsFingerprint,
  looksOpen,
  normalizeOpenExam,
  openExamFingerprint,
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

describe("crawler helpers", () => {
  it("detects open copy and domains", () => {
    assert.equal(looksOpen("Inscrições abertas até 30/09"), true);
    assert.equal(looksOpen("Resultado final homologado"), false);
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
