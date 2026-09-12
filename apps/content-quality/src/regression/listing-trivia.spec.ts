import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateRelevance } from "../relevance.js";

/** §43 regression: the six screenshot listing-trivia questions must fail rung 2. */
const LISTING_TRIVIA = [
  {
    id: "REG-001",
    prompt: "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?",
    options: [
      "Técnico de Controle Externo",
      "Analista de Sistemas",
      "Auditor",
      "Procurador",
      "Estagiário",
    ],
    correctIndex: 0,
  },
  {
    id: "REG-002",
    prompt: "Qual associação oferece o 54º Exame para Certificação — CFP®?",
    options: ["PLANEJAR", "CFP Brasil", "BACEN", "CVM", "ANBIMA"],
    correctIndex: 0,
  },
  {
    id: "REG-003",
    prompt: "Qual cargo está sendo oferecido pela Secretaria de Estado da Fazenda de Santa Catarina?",
    options: ["Auditor Fiscal", "Analista", "Técnico", "Procurador", "Estagiário"],
    correctIndex: 0,
  },
  {
    id: "REG-004",
    prompt: "O cargo de Técnico de Controle Externo é oferecido por qual instituição?",
    options: ["TCE-GO", "TCU", "SEFAZ-SP", "CGU", "STF"],
    correctIndex: 0,
  },
  {
    id: "REG-005",
    prompt: "Qual o nome da associação que realiza o 54º Exame para Certificação — CFP®?",
    options: ["PLANEJAR", "ANBIMA", "CFP", "CVM", "BACEN"],
    correctIndex: 0,
  },
  {
    id: "REG-006",
    prompt: "O que a PLANEJAR — Associação Brasileira de Planejamento Financeiro está promovendo?",
    options: ["54º Exame CFP", "Concurso público", "Vestibular", "OAB", "ENEM"],
    correctIndex: 0,
  },
];

const ADMIN_META = [
  { id: "REG-101", prompt: "Quantas vagas são oferecidas para o cargo de Analista?", options: ["10", "20", "30", "40", "50"], correctIndex: 0 },
  { id: "REG-102", prompt: "Qual a remuneração inicial do cargo de Técnico?", options: ["R$ 3.000", "R$ 5.000", "R$ 7.000", "R$ 9.000", "R$ 11.000"], correctIndex: 1 },
  { id: "REG-104", prompt: "Qual o valor da taxa de inscrição?", options: ["R$ 50", "R$ 80", "R$ 100", "R$ 120", "R$ 150"], correctIndex: 2 },
];

describe("listing-trivia regression (§43)", () => {
  for (const item of LISTING_TRIVIA) {
    it(`${item.id} is rejected by relevance rung`, () => {
      const result = validateRelevance({ ...item, origin: "generation" });
      assert.equal(result.ok, false, `${item.id} should fail: ${result.notes}`);
      assert.ok(
        result.reasons.includes("tests_exam_metadata") || result.reasons.includes("tests_syllabus_meta"),
        `${item.id} reasons=${result.reasons.join(",")}`,
      );
    });
  }

  for (const item of ADMIN_META) {
    it(`${item.id} admin metadata is rejected`, () => {
      const result = validateRelevance({ ...item, origin: "generation" });
      assert.equal(result.ok, false, `${item.id} should fail`);
    });
  }

  it("POS-001 knowledge question passes relevance", () => {
    const result = validateRelevance({
      origin: "generation",
      prompt:
        "Assinale a alternativa em que a concordância verbal está de acordo com a norma-padrão:",
      options: [
        "Chegou os convidados.",
        "Chegaram os convidados.",
        "Haviam muitos problemas.",
        "Fazem dois anos.",
        "Existe muitas dúvidas.",
      ],
      correctIndex: 1,
      explanation: "Com sujeito composto anteposto, o verbo vai para o plural.",
    });
    assert.equal(result.ok, true, result.notes);
  });
});
