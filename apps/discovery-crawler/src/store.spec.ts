import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseDetailHtml } from "./detail.js";
import { storeArtifact } from "./store.js";

describe("storeArtifact RC-2", () => {
  it("rejects listing artifacts attached to an exam", async () => {
    await assert.rejects(
      () =>
        storeArtifact({
          examId: "exam-1",
          sourceId: "src-1",
          url: "https://fixture.local/concursos/",
          withBytes: false,
          kindHint: "listing",
          roleHint: "administrative",
        }),
      /listing artifacts must not be attached to an exam/,
    );
  });

  it("detail document links never include the listing page URL", () => {
    const listingUrl = "https://www.cesgranrio.org.br/concursos/bb-escriturario/";
    const html = `
      <h1>Banco do Brasil Escriturário 2026</h1>
      <a href="${listingUrl}">Voltar para listagem</a>
      <a href="https://example.com/edital.pdf">Edital de Abertura</a>
    `;
    const detail = parseDetailHtml(html, listingUrl, "BB Escriturário");
    assert.ok(!detail.documentLinks.some((d) => d.url === listingUrl));
    assert.ok(detail.documentLinks.some((d) => d.kindHint === "edital"));
  });
});
