import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMetadataFeatures, itemText, metadataProbability, testsSyllabusMeta } from "./metadata";

// Spec §4 — the six screenshot questions (REG-001..006) and the REG-1xx classes.
const NEGATIVE_STEMS: Array<[string, string, string[]]> = [
  ["REG-001", "O Tribunal de Contas do Estado de Goiás está com inscrições abertas para qual cargo?", ["Técnico de Controle Externo", "Analista Judiciário", "Auditor Fiscal", "Procurador"]],
  ["REG-002", "Qual associação oferece o 54º Exame para Certificação — CFP®?", ["PLANEJAR", "ANBIMA", "CVM", "FEBRABAN"]],
  ["REG-003", "Qual cargo está sendo oferecido pela Secretaria de Estado da Fazenda de Santa Catarina?", ["Auditor Estadual de Finanças Públicas", "Analista", "Técnico", "Fiscal"]],
  ["REG-004", "O cargo de Técnico de Controle Externo é oferecido por qual instituição?", ["TCE-GO", "SEF-SC", "MANAUSPREV", "FDSBC"]],
  ["REG-005", "Qual o nome da associação que realiza o 54º Exame para Certificação — CFP®?", ["PLANEJAR", "ANBIMA", "CVM", "FEBRABAN"]],
  ["REG-006", "O que a PLANEJAR — Associação Brasileira de Planejamento Financeiro está promovendo?", ["54º Exame para Certificação CFP", "Concurso público", "Vestibular", "Curso"]],
  ["REG-101", "Quantas vagas são oferecidas para o cargo de Analista?", ["10", "20", "30", "40"]],
  ["REG-102", "Qual a remuneração inicial do cargo de Técnico?", ["R$ 3.000,00", "R$ 4.000,00", "R$ 5.000,00", "R$ 6.000,00"]],
  ["REG-103", "Até que data podem ser realizadas as inscrições?", ["10/03/2026", "25/03/2026", "30/03/2026", "05/04/2026"]],
  ["REG-104", "Qual o valor da taxa de inscrição?", ["R$ 80,00", "R$ 100,00", "R$ 120,00", "R$ 150,00"]],
  ["REG-105", "Qual instituição é responsável pela organização do concurso?", ["Cesgranrio", "FGV", "Cebraspe", "Vunesp"]],
  ["REG-106", "Qual o número do edital de abertura?", ["01/2026", "02/2026", "03/2026", "04/2026"]],
  ["REG-107", "Em que cidade será aplicada a prova objetiva?", ["Goiânia", "Brasília", "São Paulo", "Rio de Janeiro"]],
  ["REG-109", "Qual documento deve ser apresentado no dia da prova?", ["Documento oficial de identificação com foto", "Comprovante de residência", "Título de eleitor", "CPF"]],
  ["REG-110", "Qual a escolaridade exigida para o cargo?", ["Nível superior", "Nível médio", "Nível fundamental", "Pós-graduação"]],
  ["REG-111", "Quantas questões terá a prova objetiva?", ["40", "50", "60", "80"]],
];

// Spec §4 — POS-001..005, what the same edital should lead to.
const POSITIVE_STEMS: Array<[string, string, string[], string]> = [
  ["POS-001", "Assinale a alternativa em que a concordância verbal está de acordo com a norma-padrão:", ["Chegou os convidados atrasados.", "Chegaram os convidados atrasados.", "Fazem dois anos que ele partiu.", "Houveram muitos problemas."], "Com sujeito composto ou plural posposto, o verbo concorda no plural."],
  ["POS-002", "Leia o trecho: 'A cidade dormia enquanto o rio subia devagar.' Infere-se do texto que", ["a cidade estava alerta", "a enchente era iminente e ignorada", "o rio secou", "os moradores fugiram"], "O contraste entre dormir e subir indica ameaça não percebida."],
  ["POS-003", "Um produto de R$ 250,00 sofreu dois aumentos sucessivos de 10%. O preço final é", ["R$ 300,00", "R$ 302,50", "R$ 275,00", "R$ 305,00"], "250 × 1,1 × 1,1 = 302,50."],
  ["POS-004", "Nos termos da Lei 14.133/2021, a modalidade de licitação obrigatória para a contratação de obras de engenharia de grande vulto é", ["pregão", "concorrência", "concurso", "leilão"], "O art. 6º, XXXVIII define a concorrência para obras e serviços especiais de engenharia."],
  ["POS-005", "Considere a proposição 'Se chove, então a rua fica molhada'. Sua contrapositiva é", ["Se a rua fica molhada, então chove", "Se não chove, então a rua não fica molhada", "Se a rua não fica molhada, então não chove", "Chove e a rua não fica molhada"], "A contrapositiva de p → q é ¬q → ¬p."],
];

describe("metadataProbability on question items (§25.2 rung 2)", () => {
  for (const [id, prompt, options] of NEGATIVE_STEMS) {
    it(`${id} scores as exam metadata`, () => {
      const p = metadataProbability(itemText({ prompt, options }));
      assert.ok(p > 0.5, `${id}: expected > 0.5, got ${p}`);
    });
  }
  for (const [id, prompt, options, explanation] of POSITIVE_STEMS) {
    it(`${id} scores as subject knowledge`, () => {
      const p = metadataProbability(itemText({ prompt, options, explanation }));
      assert.ok(p <= 0.5, `${id}: expected ≤ 0.5, got ${p}`);
    });
  }
});

describe("metadataProbability on sections (§22.2, §41.1)", () => {
  it("legislation with dates and currency stays below the eligibility threshold", () => {
    const text = [
      "Art. 75. É dispensável a licitação:",
      "I - para contratação que envolva valores inferiores a R$ 100.000,00 (cem mil reais), no caso de obras e serviços de engenharia;",
      "II - para contratação que envolva valores inferiores a R$ 50.000,00 (cinquenta mil reais), no caso de outros serviços e compras;",
      "§ 1º Para fins de aferição dos valores, deverão ser observados o somatório do que for despendido no exercício financeiro.",
      "§ 2º Os valores referidos nos incisos I e II do caput serão duplicados para compras realizadas por consórcio público. Ou seja, o limite passa a ser o dobro do previsto.",
      "Art. 76. A alienação de bens da Administração Pública, subordinada à existência de interesse público devidamente justificado, será precedida de avaliação e obedecerá às seguintes normas, conforme a Lei nº 14.133, de 1º de abril de 2021.",
    ].join("\n");
    const p = metadataProbability(text);
    assert.ok(p < 0.35, `expected < 0.35, got ${p} ${JSON.stringify(extractMetadataFeatures(text))}`);
  });

  it("an edital 'Das Inscrições' chapter scores high", () => {
    const text = [
      "3. DAS INSCRIÇÕES",
      "3.1 As inscrições serão realizadas exclusivamente via internet, no período de 10/03/2026 a 25/03/2026, no endereço www.cesgranrio.org.br.",
      "3.2 O valor da taxa de inscrição é de R$ 120,00 (cento e vinte reais) para o cargo de Analista e de R$ 80,00 para o cargo de Técnico.",
      "3.3 O candidato deverá efetuar o pagamento do boleto bancário até o dia 26/03/2026.",
      "3.4 É vedada a inscrição condicional. O candidato deverá informar CPF válido.",
      "3.5 Serão oferecidas 40 vagas mais cadastro de reserva, conforme Edital nº 01/2026 e Anexo II.",
    ].join("\n");
    const p = metadataProbability(text);
    assert.ok(p > 0.6, `expected > 0.6, got ${p}`);
  });

  it("the programa itself (syllabus list shape) is metadata, not knowledge", () => {
    const text =
      "LÍNGUA PORTUGUESA: 1. Compreensão e interpretação de textos. 2. Ortografia oficial. 3. Concordância verbal e nominal. 4. Regência verbal e nominal. 5. Pontuação. 6. Crase. 7. Semântica.";
    const p = metadataProbability(text);
    assert.ok(p > 0.5, `expected > 0.5, got ${p}`);
  });

  it("explanatory grammar prose is knowledge", () => {
    const text = [
      "Concordância verbal é a relação de harmonia entre o verbo e o sujeito. A regra geral diz que o verbo concorda com o sujeito em número e pessoa.",
      "Quando o sujeito é composto e vem antes do verbo, o verbo vai para o plural. Por exemplo: 'O pai e o filho chegaram cedo.'",
      "Se o sujeito composto vier depois do verbo, o verbo pode concordar com o núcleo mais próximo ou ir para o plural: 'Chegou o pai e o filho' ou 'Chegaram o pai e o filho'.",
      "Exceção: verbos impessoais como haver (no sentido de existir) e fazer (tempo) ficam sempre na terceira pessoa do singular. Ou seja, 'Havia muitos alunos' e 'Faz dois anos'.",
    ].join("\n\n");
    const p = metadataProbability(text);
    assert.ok(p < 0.35, `expected < 0.35, got ${p}`);
  });
});

describe("testsSyllabusMeta (B2)", () => {
  it("catches stems that ask which topics are in the programa (REG-108)", () => {
    assert.equal(testsSyllabusMeta("Quais assuntos de Língua Portuguesa constam no conteúdo programático?"), true);
    assert.equal(testsSyllabusMeta("Qual dos itens abaixo consta no conteúdo programático de Língua Portuguesa?"), true);
    assert.equal(testsSyllabusMeta("Quais disciplinas serão cobradas na prova?"), true);
  });
  it("does not flag real subject questions", () => {
    assert.equal(testsSyllabusMeta("Assinale a alternativa em que a concordância verbal está correta:"), false);
    assert.equal(testsSyllabusMeta("Nos termos da Lei 14.133/2021, a modalidade de licitação obrigatória é"), false);
  });
});
