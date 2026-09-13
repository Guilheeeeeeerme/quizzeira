import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cesgranrioPortalEventId, parseCesgranrioPortalContents } from "./cesgranrio-portal.js";

describe("cesgranrio portal enrichment", () => {
  it("finds the portal event id on the marketing page", () => {
    const html = '<a href="https://concursos.cesgranrio.org.br/portal/avaliacoes/22">INSCREVA-SE</a>';
    assert.equal(cesgranrioPortalEventId(html, "https://www.cesgranrio.org.br/concurso/transpetro-2026/"), "22");
    assert.equal(cesgranrioPortalEventId("", "https://concursos.cesgranrio.org.br/portal/avaliacoes/27"), "27");
    assert.equal(cesgranrioPortalEventId("<p>nada</p>", "https://x.org/"), null);
  });

  it("extracts edital and retificação PDFs from content sections", () => {
    const docs = parseCesgranrioPortalContents({
      success: true,
      data: [
        {
          titulo: "ACESSO AOS EDITAIS",
          texto:
            '<table><tr><td><a href="https://concursos.cesgranrio.org.br/media/e/22/a.pdf?sv=1">EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR - 2026.4</a></td>' +
            '<td><a href="https://concursos.cesgranrio.org.br/media/e/22/b.pdf?sv=1">ACESSE AQUI</a></td></tr></table>' +
            '<a href="https://www.youtube.com/live/x">TRANSMISSÃO</a>',
        },
        {
          titulo: "ACESSO ÀS RETIFICAÇÕES",
          texto: '<a href="https://concursos.cesgranrio.org.br/media/e/22/c.pdf">RETIFICAÇÃO 05 EDITAL Nº 04 - 11/09/2026</a>',
        },
        { titulo: "CENTRAL", texto: '<a href="tel:0800">0800</a>' },
      ],
    });
    assert.deepEqual(
      docs.map((d) => [d.kindHint, d.roleHint]),
      [
        ["edital", "specification"],
        ["unknown", "unknown"],
        ["retificacao", "specification"],
      ],
    );
    assert.equal(docs[1]!.anchorLabel, "ACESSO AOS EDITAIS (anexo)");
  });
});
