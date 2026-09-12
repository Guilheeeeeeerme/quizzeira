import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateRelevance } from "./relevance";

const opts4 = ["Alternativa um", "Alternativa dois", "Alternativa três", "Alternativa quatro"];

// Spec §41.4 — must fail before the judge, with the LLM disabled.
const NEGATIVE: Array<[string, string]> = [
  ["Quantas vagas são oferecidas para o cargo de Analista?", "tests_exam_metadata"],
  ["Qual o valor da taxa de inscrição?", "tests_exam_metadata"],
  ["Até que data podem ser realizadas as inscrições?", "tests_exam_metadata"],
  ["Qual instituição é responsável pela organização do concurso?", "tests_exam_metadata"],
  ["Qual a remuneração inicial do cargo?", "tests_exam_metadata"],
  ["Quais assuntos de Língua Portuguesa constam no conteúdo programático?", "tests_syllabus_meta"],
  ["Em que cidade será aplicada a prova objetiva?", "tests_exam_metadata"],
  ["Qual o número do edital de abertura?", "tests_exam_metadata"],
];

// Spec §43 — the six screenshot items (REG-001..006), with their real options.
const SCREENSHOTS: Array<[string, string[]]> = [
  ["O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?", ["Técnico de Controle Externo", "Analista Judiciário", "Auditor Fiscal", "Procurador"]],
  ["Qual associação oferece o 54º Exame para Certificação — CFP®?", ["PLANEJAR", "ANBIMA", "CVM", "FEBRABAN"]],
  ["Qual cargo está sendo oferecido pela Secretaria de Estado da Fazenda de Santa Catarina?", ["Auditor Estadual de Finanças Públicas", "Analista", "Técnico", "Fiscal"]],
  ["O cargo de Técnico de Controle Externo é oferecido por qual instituição?", ["TCE-GO", "SEF-SC", "MANAUSPREV", "FDSBC"]],
  ["Qual o nome da associação que realiza o 54º Exame para Certificação — CFP®?", ["PLANEJAR", "ANBIMA", "CVM", "FEBRABAN"]],
  ["O que a PLANEJAR — Associação Brasileira de Planejamento Financeiro está promovendo?", ["54º Exame para Certificação CFP", "Concurso público", "Vestibular", "Curso"]],
];

// Spec §4 — POS-001..005 must pass this rung with zero reasons.
const POSITIVE: Array<[string, string[], number, string]> = [
  ["Assinale a alternativa em que a concordância verbal está de acordo com a norma-padrão:", ["Chegou os convidados atrasados.", "Chegaram os convidados atrasados.", "Fazem dois anos que ele partiu.", "Houveram muitos problemas."], 1, "Com sujeito plural posposto, o verbo concorda no plural."],
  ["Leia o trecho: 'A cidade dormia enquanto o rio subia devagar.' Infere-se do texto que", ["a cidade estava alerta", "a enchente era iminente e ignorada", "o rio secou", "os moradores fugiram"], 1, "O contraste entre dormir e subir indica ameaça não percebida."],
  ["Um produto de R$ 250,00 sofreu dois aumentos sucessivos de 10%. O preço final é", ["R$ 300,00", "R$ 302,50", "R$ 275,00", "R$ 305,00"], 1, "250 × 1,1 × 1,1 = 302,50."],
  ["Nos termos da Lei 14.133/2021, a modalidade de licitação obrigatória para a contratação de obras de engenharia de grande vulto é", ["pregão", "concorrência", "concurso", "leilão"], 1, "O art. 6º define a concorrência para obras e serviços especiais de engenharia."],
  ["Considere a proposição 'Se chove, então a rua fica molhada'. Sua contrapositiva é", ["Se a rua fica molhada, então chove", "Se não chove, então a rua não fica molhada", "Se a rua não fica molhada, então não chove", "Chove e a rua não fica molhada"], 2, "A contrapositiva de p → q é ¬q → ¬p."],
];

describe("relevance rung (§25.2, §41.4)", () => {
  for (const [prompt, reason] of NEGATIVE) {
    it(`fails "${prompt.slice(0, 40)}…" with ${reason}`, () => {
      const r = validateRelevance({ prompt, options: opts4, origin: "generation" });
      assert.equal(r.ok, false);
      assert.ok(r.reasons.includes(reason as never), `${r.reasons.join(",")} p=${r.metadataProbability}`);
    });
  }
  for (const [prompt, options] of SCREENSHOTS) {
    it(`REG: fails "${prompt.slice(0, 40)}…" as exam metadata`, () => {
      const r = validateRelevance({ prompt, options, origin: "generation" });
      assert.equal(r.ok, false);
      assert.ok(r.reasons.includes("tests_exam_metadata"), `${r.reasons.join(",")} p=${r.metadataProbability}`);
    });
  }
  for (const [prompt, options, correctIndex, explanation] of POSITIVE) {
    it(`POS: passes "${prompt.slice(0, 40)}…"`, () => {
      const r = validateRelevance({ prompt, options, correctIndex, explanation, origin: "generation" }, new Date("2026-09-12"));
      assert.equal(r.ok, true, `${r.reasons.join(",")} p=${r.metadataProbability}`);
      assert.deepEqual(r.reasons, []);
      assert.deepEqual(r.reviewReasons, []);
    });
  }

  it("parks temporally dependent stems without a legal citation", () => {
    const r = validateRelevance(
      { prompt: "Quem é atualmente o presidente do Supremo Tribunal Federal?", options: opts4, origin: "generation" },
      new Date("2026-09-12"),
    );
    assert.equal(r.ok, true);
    assert.deepEqual(r.reviewReasons, ["temporally_dependent"]);
    const legal = validateRelevance(
      { prompt: "Segundo a redação vigente do art. 37 da CF/88, a administração pública obedecerá aos princípios de", options: opts4, origin: "generation" },
      new Date("2026-09-12"),
    );
    assert.deepEqual(legal.reviewReasons, []);
  });

  it("downgrades metadata hits on past-exam transcriptions to review instead of failing", () => {
    const r = validateRelevance({ prompt: "Quantas vagas são oferecidas para o cargo de Analista?", options: opts4, origin: "extraction" });
    assert.equal(r.ok, true);
    assert.deepEqual(r.reasons, []);
    assert.ok(r.reviewReasons.includes("tests_exam_metadata"));
  });
});
