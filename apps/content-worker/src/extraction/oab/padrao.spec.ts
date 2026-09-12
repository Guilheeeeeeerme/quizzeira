import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePadraoText } from "./padrao";

const ANSWER = "O examinando deve indicar o cabimento da medida, com fundamento no dispositivo legal aplicável ao caso narrado.";

const PADRAO = [
  "XXXIV EXAME DE ORDEM UNIFICADO",
  "Padrão de respostas definitivo (Direito Civil)",
  "PADRÃO DE RESPOSTA – PEÇA PROFISSIONAL (Valor: 5,00)",
  "Enunciado",
  "Determinado cliente procura advogado após ser citado em ação de cobrança.",
  "Gabarito Comentado",
  ANSWER,
  "Página 2 de 6",
  "PADRÃO DE RESPOSTA – QUESTÃO 01 (Valor: 1,25)",
  "Enunciado",
  "Pergunta-se: é possível a cumulação de pedidos?",
  "Gabarito Comentado",
  `Sim. ${ANSWER}`,
  "PADRÃO DE RESPOSTA – QUESTÃO 02 (Valor: 1,25)",
  "Enunciado",
  "Segundo enunciado discursivo do caderno.",
  "Gabarito Comentado",
  `Não. ${ANSWER}`,
].join("\n");

describe("parsePadraoText", () => {
  it("recovers the peça and the questões discursivas as separate items", () => {
    const result = parsePadraoText(PADRAO);
    assert.equal(result.items.length, 3);
    assert.equal(result.items[0].kind, "peca");
    assert.equal(result.items[0].number, null);
    assert.deepEqual(
      result.items.slice(1).map((i) => i.number),
      [1, 2],
    );
  });

  it("keeps the enunciado and the banca's model answer apart", () => {
    const [peca] = parsePadraoText(PADRAO).items;
    assert.match(peca.enunciado, /ação de cobrança/);
    assert.equal(peca.answer, ANSWER);
    assert.ok(!peca.enunciado.includes("examinando"));
  });

  it("reads the printed point values", () => {
    const result = parsePadraoText(PADRAO);
    assert.equal(result.items[0].value, 5);
    assert.equal(result.items[1].value, 1.25);
  });

  it("reads the área and the definitive flag off the cover", () => {
    const result = parsePadraoText(PADRAO);
    assert.equal(result.area?.code, "B002");
    assert.equal(result.definitive, true);
  });

  it("drops page furniture from the answer", () => {
    const [peca] = parsePadraoText(PADRAO).items;
    assert.ok(!peca.answer.includes("Página"));
  });

  it("still yields the answer when the section has no markers", () => {
    const result = parsePadraoText(
      ["PADRÃO DE RESPOSTA – QUESTÃO 03 (Valor: 1,25)", ANSWER].join("\n"),
    );
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0].enunciado, "");
    assert.equal(result.items[0].answer, ANSWER);
  });

  it("skips a section with no usable answer text", () => {
    const result = parsePadraoText(
      ["PADRÃO DE RESPOSTA – QUESTÃO 04 (Valor: 1,25)", "Gabarito Comentado", "Anulada."].join("\n"),
    );
    assert.equal(result.items.length, 0);
  });
});
