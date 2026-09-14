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

import { categorizeEditalLabel, parseCesgranrioPortalEditais } from "./cesgranrio-portal.js";

describe("cesgranrio portal editais split", () => {
  it("yields one exam per EDITAL Nº row with its retificações and categories", () => {
    const M = "https://concursos.cesgranrio.org.br/media/e/22";
    const editais = parseCesgranrioPortalEditais({
      data: [
        {
          titulo: "ACESSO AOS EDITAIS",
          texto:
            "<table><tr><td>SORTEIO PÚBLICO</td><td></td><td></td></tr>" +
            `<tr><td><a href="${M}/s.pdf">EDITAL DE CONVOCAÇÃO DE SORTEIO PÚBLICO Nº 1/2026</a></td><td></td><td></td></tr>` +
            `<tr><td><a href="${M}/e1.pdf">EDITAL Nº 01 - TRANSPETRO/PSP/MAR-2026.1</a></td><td>R$ 81,50</td><td><a href="${M}/c1.pdf">ACESSE AQUI</a></td></tr>` +
            `<tr><td><a href="${M}/e4.pdf">EDITAL Nº 04 - TRANSPETRO/PSP/TERRA/NÍVEL SUPERIOR - 2026.4</a></td><td>R$ 117,00</td><td><a href="${M}/c4.pdf">ACESSE AQUI</a></td></tr></table>`,
        },
        {
          titulo: "ACESSO ÀS RETIFICAÇÕES",
          texto: `<table><tr><td>&gt;&gt; <a href="${M}/r41.pdf">RETIFICAÇÃO 05 EDITAL Nº 04 - 11/09/2026</a> <a href="${M}/r11.pdf">RETIFICAÇÃO 01 EDITAL Nº 01 - 19/08/2026</a></td><td></td><td></td></tr></table>`,
        },
      ],
    });
    assert.deepEqual(editais.map((e) => e.number), [1, 4]);
    assert.equal(editais[0]!.editionKey, "2026.1");
    assert.deepEqual(editais[0]!.emphasis, ["Mar"]);
    assert.deepEqual(editais[1]!.emphasis, ["Terra", "Nível superior"]);
    assert.deepEqual(
      editais[1]!.documentLinks.map((d) => [d.kindHint, d.url.split("/").pop()]),
      [["edital", "e4.pdf"], ["retificacao", "r41.pdf"]],
    );
    assert.deepEqual(categorizeEditalLabel("TRANSPETRO/PSP/TERRA/NÍVEL MÉDIO - 2026.3"), ["Terra", "Nível médio"]);
  });
});
