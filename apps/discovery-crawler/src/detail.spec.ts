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
