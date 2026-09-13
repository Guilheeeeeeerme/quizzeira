import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { inferExamKind } from "@quizzeira/shared";
import { parseDetailHtml } from "./detail.js";

describe("parseDetailHtml", () => {
  it("extracts document links with kind and role hints", () => {
    const html = readFileSync(
      resolve(__dirname, "../fixtures/detail-page.html"),
      "utf8",
    );
    const detail = parseDetailHtml(
      html,
      "https://www.cesgranrio.org.br/concurso/transpetro-2026/",
      "Transpetro 2026",
    );

    assert.ok(detail.documentLinks.length >= 3);
    const edital = detail.documentLinks.find((d) => d.kindHint === "edital");
    assert.ok(edital);
    assert.equal(edital.roleHint, "specification");
    assert.ok(detail.documentLinks.some((d) => d.kindHint === "prova"));
    assert.ok(detail.documentLinks.some((d) => d.kindHint === "gabarito"));
    assert.equal(detail.status, "open");
    assert.equal(detail.statusSource, "date");
    assert.ok(detail.editionKey);
    assert.ok(detail.positions.length >= 1);
    assert.equal(detail.kind, "concurso");
  });

  it("marks PLANEJAR CFP certification as exam kind other", () => {
    const html = `
      <html><body>
        <h1>54º Exame para Certificação — CFP®</h1>
        <p>PLANEJAR — Associação Brasileira de Planejamento Financeiro</p>
        <a href="/edital.pdf">Edital do exame</a>
      </body></html>
    `;
    const detail = parseDetailHtml(
      html,
      "https://fixture.local/concurso/planejar-cfp/",
      "PLANEJAR — 54º Exame para Certificação — CFP®",
    );
    assert.equal(detail.kind, "other");
    assert.equal(inferExamKind(detail.title, html), "other");
  });

  it("does not include inscrição online as a document link", () => {
    const html = readFileSync(
      resolve(__dirname, "../fixtures/detail-page.html"),
      "utf8",
    );
    const detail = parseDetailHtml(html, "https://fixture.local/detail", "Test");
    assert.ok(!detail.documentLinks.some((d) => /inscri/i.test(d.anchorLabel)));
  });
});

import {
  extractConcursoHeadline,
  isSelfDetailPage,
  withinRegistrationGrace,
} from "./detail.js";

describe("self-detail concurso pages", () => {
  it("headline, detection and registration grace", () => {
  const text =
    "IBAM - Concursos Públicos no Estado de São Paulo Concursos/ Processos Seletivos/ Vestibulares " +
    "Concurso Público SANTOS - CONCURSO PÚBLICO - 74/2026 SEPLA-RH Inscrições de 22/07/2026 a 20/08/2026 Informações Gerais";
  assert.equal(extractConcursoHeadline(text), "SANTOS - CONCURSO PÚBLICO - 74/2026 SEPLA-RH");
  assert.equal(extractConcursoHeadline("Notícias e resultados"), null);

  const docs = [
    { url: "https://anexos.example/a.pdf", anchorLabel: "01- Edital de Abertura", kindHint: "edital" as const, roleHint: "specification" as const },
  ];
  assert.equal(
    isSelfDetailPage({ registrationEnd: new Date("2026-08-20T23:59:59Z"), documentLinks: docs }, [
      "https://anexos.example/a.pdf",
      "https://anexos.example/b.pdf",
    ]),
    true,
  );
  assert.equal(
    isSelfDetailPage({ registrationEnd: null, documentLinks: docs }, ["https://anexos.example/a.pdf"]),
    false,
  );
  assert.equal(
    isSelfDetailPage({ registrationEnd: new Date("2026-08-20T23:59:59Z"), documentLinks: docs }, [
      "https://banca.example/concurso/a/",
      "https://banca.example/concurso/b/",
      "https://banca.example/concurso/c/",
    ]),
    false,
  );

  const now = new Date("2026-09-13T12:00:00Z");
  assert.equal(withinRegistrationGrace(new Date("2026-08-20T23:59:59Z"), now), true);
  assert.equal(withinRegistrationGrace(new Date("2026-04-01T23:59:59Z"), now), false);
  assert.equal(withinRegistrationGrace(new Date("2026-09-21T23:59:59Z"), now), false);
  assert.equal(withinRegistrationGrace(null, now), false);
});
});

import { hasExamIdentity } from "./detail.js";

describe("hasExamIdentity", () => {
  it("rejects nav/chrome rows and accepts real concursos", () => {
    const none = { editionKey: null, registrationEnd: null, documentLinks: [] as never[] };
    assert.equal(hasExamIdentity({ ...none, title: "Cebraspe | O melhor em avaliação de pessoas" }), false);
    assert.equal(hasExamIdentity({ ...none, title: "MAIS INFORMAÇÕES" }), false);
    assert.equal(hasExamIdentity({ ...none, title: "Concursos" }), false);
    assert.equal(hasExamIdentity({ ...none, title: "Concurso Transpetro 2026", editionKey: "2026" }), true);
    assert.equal(
      hasExamIdentity({
        ...none,
        title: "Concurso Público para a Defensoria Pública",
        documentLinks: [{ url: "https://x/edital.pdf", anchorLabel: "Edital", kindHint: "edital", roleHint: "specification" }],
      }),
      true,
    );
  });
});
