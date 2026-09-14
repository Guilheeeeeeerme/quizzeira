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

import { canonicalArtifactUrl } from "./store.js";

describe("canonicalArtifactUrl", () => {
  it("drops rotating SAS signature params but keeps ordinary query strings", () => {
    assert.equal(
      canonicalArtifactUrl(
        "https://concursos.cesgranrio.org.br/media/e/22/x.pdf?sv=2025-01-05&se=2036-09-10T17%3A48%3A49Z&sr=c&sp=r&sig=abc%3D",
      ),
      "https://concursos.cesgranrio.org.br/media/e/22/x.pdf",
    );
    assert.equal(canonicalArtifactUrl("https://x.org/doc?id=7"), "https://x.org/doc?id=7");
  });
});
