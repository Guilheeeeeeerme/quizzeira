import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDetailHtml } from "./detail.js";

const DETAIL_HTML = `<!doctype html><html><head><title>Concurso TCE-GO 2026</title></head>
<body>
<h1>Tribunal de Contas do Estado de Goiás — Edital nº 01/2026</h1>
<p>Inscrições de 10/10/2026 a 25/11/2026. Cargos de Analista de Sistemas e Técnico de Controle Externo.</p>
<a href="/docs/edital-01-2026.pdf">Edital de Abertura</a>
<a href="/docs/gabarito.pdf">Gabarito Preliminar</a>
<a href="/docs/caderno.pdf">Caderno de Questões</a>
<a href="/inscricao">Inscrição online</a>
</body></html>`;

const LISTING_TRIVIA = `<!doctype html><html><body>
<h1>Concursos</h1>
<a href="/concurso/tce-go">TCE-GO — Técnico — inscrições abertas</a>
<a href="/concurso/sef-sc">SEF-SC — Analista — inscrições abertas</a>
<a href="/concurso/manausprev">MANAUSPREV — inscrições abertas</a>
<a href="/certificacao/cfp">PLANEJAR — 54º Exame CFP®</a>
<a href="/concurso/fdsbc">FDSBC — inscrições abertas</a>
</body></html>`;

describe("parseDetailHtml", () => {
  it("extracts edition identity, registration window, positions and doc hints", () => {
    const detail = parseDetailHtml(DETAIL_HTML, "https://banca.example/concurso/tce-go-2026/");
    assert.equal(detail.examKind, "concurso");
    assert.ok(detail.editionKey?.includes("2026"));
    assert.equal(detail.registrationEnd, "2026-11-25");
    assert.equal(detail.status, "open");
    assert.equal(detail.statusSource, "date");
    assert.ok(detail.positions.some((p) => /Analista/i.test(p)));
    assert.ok(detail.documents.some((d) => d.kindHint === "edital"));
    assert.ok(detail.documents.some((d) => d.kindHint === "gabarito"));
    assert.ok(detail.documents.some((d) => d.kindHint === "prova"));
    assert.equal(detail.looksLikeListing, false);
  });

  it("flags listing-trivia pages and non-concurso certifications", () => {
    const detail = parseDetailHtml(LISTING_TRIVIA, "https://portal.example/concursos/");
    assert.equal(detail.looksLikeListing, true);
  });

  it("classifies CFP certification as non-concurso", () => {
    const html = `<html><h1>54º Exame para Certificação CFP® — PLANEJAR</h1><p>Inscrições abertas</p></html>`;
    const detail = parseDetailHtml(html, "https://portal.example/cfp/");
    assert.equal(detail.examKind, "certification");
  });
});
