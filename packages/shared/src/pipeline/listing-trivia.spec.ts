// Concept: Listing-trivia stem denylist unit tests (§43.2.3).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeListingTriviaStem } from "./listing-trivia.js";

describe("looksLikeListingTriviaStem", () => {
  it("flags REG-001..006 style stems", () => {
    const stems = [
      "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?",
      "Qual associação oferece o 54º Exame para Certificação — CFP®?",
      "Qual cargo está sendo oferecido pela Secretaria de Estado da Fazenda de Santa Catarina?",
      "O cargo de Técnico de Controle Externo é oferecido por qual instituição?",
      "Qual o nome da associação que realiza o 54º Exame para Certificação — CFP®?",
      "O que a PLANEJAR — Associação Brasileira de Planejamento Financeiro está promovendo?",
    ];
    for (const s of stems) {
      assert.equal(looksLikeListingTriviaStem(s), true, s);
    }
  });

  it("allows knowledge stems", () => {
    assert.equal(
      looksLikeListingTriviaStem(
        "Sobre concordância verbal, assinale a alternativa correta.",
      ),
      false,
    );
  });

  it("flags vacancy listing stems", () => {
    assert.equal(
      looksLikeListingTriviaStem("Quantas vagas são oferecidas para o cargo de Analista?"),
      true,
    );
  });
});
