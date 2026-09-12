import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDetailHtml } from "./detail.js";
import { isPublicHttpUrl } from "./robots.js";
import { filterSearchHit } from "./search/filter.js";

describe("detail page parse", () => {
  it("extracts edital PDF links with kind hints", () => {
    const html = `
      <html><body>
        <h1>Concurso TCE-GO 2026</h1>
        <a href="/files/edital-abertura.pdf">Edital de Abertura</a>
        <a href="/files/gabarito.pdf">Gabarito Definitivo</a>
        <a href="/home">Voltar</a>
      </body></html>`;
    const detail = parseDetailHtml(html, "https://banca.example/concurso/tce-go-2026/");
    assert.ok(detail.documents.some((d) => d.kindHint === "edital"));
    assert.ok(detail.documents.some((d) => d.kindHint === "gabarito"));
    assert.ok(!detail.documents.some((d) => /voltar/i.test(d.label)));
  });
});

describe("ssrf guard", () => {
  it("blocks localhost and private hosts", () => {
    assert.equal(isPublicHttpUrl("http://127.0.0.1/secret"), false);
    assert.equal(isPublicHttpUrl("http://169.254.169.254/latest"), false);
    assert.equal(isPublicHttpUrl("https://planalto.gov.br/lei"), true);
  });
});

describe("search filter", () => {
  it("rejects checkout and social hits", () => {
    assert.equal(
      filterSearchHit({
        url: "https://shop.example/checkout",
        title: "Comprar curso",
        provider: "t",
        rank: 1,
        query: "x",
      }),
      false,
    );
  });
});
