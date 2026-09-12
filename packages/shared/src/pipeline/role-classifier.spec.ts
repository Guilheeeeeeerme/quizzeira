import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeHtml, normalizePlainText } from "./html-normalize";
import { classifyDocumentRole, roleInputFromNormalized } from "./role-classifier";
import { decideEligibility } from "./eligibility";
import { classifySection } from "./section-classifier";
import { scoreSectionOf } from "./scoring";

// Reconstruction of the portal page behind screenshots #1–#6 (spec §43.1).
const LISTING_HTML = `<!doctype html><html><head><title>Concursos</title></head><body>
<header><a href="/">Início</a> <a href="/concursos">Concursos</a> <a href="/contato">Contato</a></header>
<main>
<h1>Concursos abertos</h1>
<ul>
<li><a href="/concurso/tce-go-2026/">TCE-GO — Técnico de Controle Externo — inscrições abertas</a></li>
<li><a href="/concurso/planejar-cfp-54/">PLANEJAR — 54º Exame para Certificação — CFP® — inscrições abertas</a></li>
<li><a href="/concurso/sef-sc-2026/">SEF-SC — Auditor Estadual de Finanças Públicas — inscrições abertas</a></li>
<li><a href="/concurso/manausprev-2026/">MANAUSPREV — diversos cargos — inscrições abertas</a></li>
<li><a href="/concurso/fdsbc-2026/">FDSBC — Processo Seletivo de Direito — inscrições abertas</a></li>
</ul>
<p>Veja também: <a href="/concursos/previstos">concursos previstos</a> e <a href="/concursos/andamento">concursos em andamento</a>.</p>
</main>
<footer><a href="/">Voltar para home</a> <a href="/mapa">Mapa do site</a></footer>
</body></html>`;

const EDITAL_TEXT = `EDITAL Nº 01/2026 – CONCURSO PÚBLICO – TRIBUNAL DE CONTAS DO ESTADO DE GOIÁS

1. DAS DISPOSIÇÕES PRELIMINARES
1.1 O concurso público será regido por este edital e executado pela banca organizadora.

2. DAS VAGAS
| Cargo | Vagas | Requisitos | Remuneração |
| --- | --- | --- | --- |
| Técnico de Controle Externo | 20 | Nível superior | R$ 9.500,00 |

3. DAS INSCRIÇÕES
3.1 As inscrições serão realizadas de 10/03/2026 a 25/03/2026. O candidato deverá pagar o boleto até 26/03/2026.
3.2 O valor da taxa de inscrição é de R$ 120,00. É vedada a inscrição condicional.

4. DAS PROVAS
4.1 A prova objetiva terá 60 questões, com peso 1 e nota mínima de 50%. Será eliminatória e classificatória.

5. DOS RECURSOS
5.1 Caberá recurso contra o gabarito preliminar em até dois dias úteis.

6. DAS DISPOSIÇÕES FINAIS
6.1 Os casos omissos serão resolvidos pela comissão do concurso.

ANEXO II – CONTEÚDO PROGRAMÁTICO
CONHECIMENTOS BÁSICOS
LÍNGUA PORTUGUESA: 1. Compreensão e interpretação de textos. 2. Ortografia oficial. 3. Concordância verbal e nominal. 4. Regência verbal e nominal. 5. Pontuação.
RACIOCÍNIO LÓGICO: 1. Proposições. 2. Conectivos. 3. Tabelas-verdade. 4. Equivalências.
CONHECIMENTOS ESPECÍFICOS
CONTROLE EXTERNO: 1. Tribunais de Contas: competências constitucionais. 2. Lei Orgânica do TCE-GO. 3. Fiscalização: auditoria, inspeção e levantamento.`;

const PROVA_TEXT = `CADERNO DE QUESTÕES – PROVA OBJETIVA – TIPO 1
LÍNGUA PORTUGUESA

Questão 1 - Assinale a alternativa em que a concordância verbal está correta.
a) Chegou os convidados.
b) Chegaram os convidados.
c) Fazem dois anos.
d) Houveram problemas.
e) Existe muitos casos.

Questão 2 - Considere a proposição "Se chove, então a rua fica molhada". Sua contrapositiva é:
a) Se a rua fica molhada, então chove.
b) Se não chove, então a rua não fica molhada.
c) Se a rua não fica molhada, então não chove.
d) Chove e a rua não fica molhada.
e) Nenhuma das anteriores.

Questão 3 - Um produto de R$ 250,00 sofreu dois aumentos de 10%. O preço final é:
a) R$ 300,00
b) R$ 302,50
c) R$ 275,00
d) R$ 305,00
e) R$ 310,00`;

const GRAMMAR_HTML = `<!doctype html><html><head><title>Concordância verbal – regras e exemplos</title></head><body>
<nav><a href="/">Início</a><a href="/gramatica">Gramática</a></nav>
<article>
<h1>Concordância verbal</h1>
<p>Concordância verbal é a relação de harmonia entre o verbo e o sujeito da oração. A regra geral diz que o verbo concorda com o sujeito em número e pessoa, isto é, sujeito no singular pede verbo no singular e sujeito no plural pede verbo no plural. Essa definição vale para todas as vozes verbais e é a base das demais regras.</p>
<h2>Sujeito composto</h2>
<p>Quando o sujeito é composto e vem antes do verbo, o verbo vai para o plural. Por exemplo: "O pai e o filho chegaram cedo." Se o sujeito composto vier depois do verbo, o verbo pode concordar com o núcleo mais próximo ou ir para o plural: "Chegou o pai e o filho" ou "Chegaram o pai e o filho". Essa flexibilidade é aceita pela norma-padrão e costuma ser cobrada em provas.</p>
<h2>Verbos impessoais</h2>
<p>Verbos impessoais como haver (no sentido de existir) e fazer (indicando tempo) ficam sempre na terceira pessoa do singular. Ou seja, o correto é "Havia muitos alunos na sala" e "Faz dois anos que ele partiu". Exceção: quando haver é auxiliar de outro verbo, ele concorda normalmente, como em "Eles haviam saído".</p>
<h2>Exercícios</h2>
<p>Exemplo: reescreva "Fazem dois anos que não o vejo" segundo a norma-padrão. Resposta: "Faz dois anos que não o vejo", porque fazer indicando tempo é impessoal e deve permanecer no singular.</p>
</article>
<footer><a href="/sobre">Sobre</a> <a href="/contato">Contato</a></footer>
</body></html>`;

describe("classifyDocumentRole — Tier 1 lexical (§14.2)", () => {
  it("REG-DOC-001: the screenshot listing page is administrative with no LLM", () => {
    const doc = normalizeHtml({ html: LISTING_HTML, documentId: "listing", url: "https://portal.example/concursos" });
    const result = classifyDocumentRole(roleInputFromNormalized(doc, { anchorLabel: "Concursos" }));
    assert.equal(result.role, "administrative", JSON.stringify(result));
    assert.ok(result.confidence >= 0.75, `confidence ${result.confidence}`);
    assert.notEqual(result.method, "llm");
    // Nothing from this page can ever become an eligible chunk.
    for (const section of doc.sections) {
      const decision = decideEligibility({
        documentRole: result.role,
        sectionRole: classifySection(section, doc.blocks.slice(section.blockRange[0], section.blockRange[1] + 1)).role,
        language: doc.stats.language,
        scores: scoreSectionOf(section, doc.blocks),
        charCount: section.charCount,
        mappedScore: 1,
      });
      assert.notEqual(decision.status, "eligible");
      assert.equal(decision.reason, "role");
    }
  });

  it("an edital is specification, subtype edital_abertura", () => {
    const doc = normalizePlainText({ text: EDITAL_TEXT, documentId: "edital" });
    const result = classifyDocumentRole(roleInputFromNormalized(doc, { filename: "edital_01_2026.pdf" }));
    assert.equal(result.role, "specification", JSON.stringify(result));
    assert.equal(result.subtype, "edital_abertura");
    assert.ok(result.confidence >= 0.75);
  });

  it("a caderno de questões is evidence", () => {
    const doc = normalizePlainText({ text: PROVA_TEXT, documentId: "prova" });
    const result = classifyDocumentRole(roleInputFromNormalized(doc, { anchorLabel: "Caderno de Questões – Tipo 1" }));
    assert.equal(result.role, "evidence", JSON.stringify(result));
    assert.equal(result.subtype, "prova_objetiva");
  });

  it("a grammar article discovered by topic query is knowledge", () => {
    const doc = normalizeHtml({ html: GRAMMAR_HTML, documentId: "gram", url: "https://gramatica.example/concordancia-verbal" });
    const result = classifyDocumentRole(roleInputFromNormalized(doc, { discoveryMode: "topic_query" }));
    assert.equal(result.role, "knowledge", JSON.stringify(result));
    assert.ok(result.confidence >= 0.75);
  });

  it("returns unknown when the margin is below 0.3", () => {
    const result = classifyDocumentRole({
      titleBlock: "Página",
      headings: [],
      blocks: [{ type: "paragraph", text: "Texto curto sem sinais." }],
      linkDensity: 0,
    });
    assert.equal(result.role, "unknown");
    assert.equal(result.method, "none");
  });

  it("provenance: legislation source is knowledge/lei by Tier 0", () => {
    const result = classifyDocumentRole({
      titleBlock: "LEI Nº 14.133, DE 1º DE ABRIL DE 2021",
      headings: ["Art. 1º", "Art. 2º"],
      blocks: [{ type: "paragraph", text: "Art. 1º Esta Lei estabelece normas gerais de licitação e contratação." }],
      linkDensity: 0,
      sourceKind: "legislation",
    });
    assert.equal(result.role, "knowledge");
    assert.equal(result.subtype, "lei");
  });

  it("admin role overrides everything", () => {
    const result = classifyDocumentRole({
      titleBlock: "Concursos abertos",
      headings: [],
      blocks: [],
      linkDensity: 0.9,
      adminRole: "knowledge",
    });
    assert.equal(result.role, "knowledge");
    assert.equal(result.method, "admin");
    assert.equal(result.confidence, 1);
  });
});

describe("section roles inside a specification document (§14.5)", () => {
  const doc = normalizePlainText({ text: EDITAL_TEXT, documentId: "edital" });
  const byHeading = (re: RegExp) => {
    const section = doc.sections.find((s) => s.heading && re.test(s.heading));
    assert.ok(section, `no section matching ${re}; headings: ${doc.sections.map((s) => s.heading).join(" | ")}`);
    return classifySection(section, doc.blocks.slice(section.blockRange[0], section.blockRange[1] + 1));
  };
  it("labels inscrições / provas / programa / disposições", () => {
    assert.equal(byHeading(/DAS INSCRI/).role, "registration");
    assert.equal(byHeading(/DAS PROVAS/).role, "exam_structure");
    assert.equal(byHeading(/DISPOSIÇÕES FINAIS/).role, "legal_disposition");
    assert.equal(byHeading(/DAS VAGAS/).role, "vacancies");
  });
  it("labels the programa lists as syllabus so they never feed generation", () => {
    const roles = doc.sections
      .filter((s) => /^CONHECIMENTOS/.test(s.heading ?? ""))
      .map((s) => classifySection(s, doc.blocks.slice(s.blockRange[0], s.blockRange[1] + 1)).role);
    assert.ok(roles.length >= 2, `found ${roles.length} subject sections`);
    for (const role of roles) assert.equal(role, "syllabus");
  });
});

describe("knowledge document scoring and eligibility (§20, §22)", () => {
  it("grammar article sections are content, score above threshold and are eligible once mapped", () => {
    const doc = normalizeHtml({ html: GRAMMAR_HTML, documentId: "gram" });
    const contentSections = doc.sections.filter((s) => s.charCount >= 300);
    assert.ok(contentSections.length >= 2);
    let eligible = 0;
    for (const section of contentSections) {
      const own = doc.blocks.slice(section.blockRange[0], section.blockRange[1] + 1);
      const role = classifySection(section, own).role;
      const scores = scoreSectionOf(section, doc.blocks);
      const decision = decideEligibility({
        documentRole: "knowledge",
        sectionRole: role,
        language: doc.stats.language,
        scores,
        charCount: section.charCount,
        mappedScore: 0.7,
      });
      if (decision.status === "eligible") eligible += 1;
      else assert.fail(`${section.heading}: ${decision.reason} role=${role} ${JSON.stringify(scores)}`);
    }
    assert.ok(eligible >= 2);
  });
  it("unmapped chunks are parked, not rejected", () => {
    const decision = decideEligibility({
      documentRole: "knowledge",
      sectionRole: "content",
      language: "pt",
      scores: { contentDensity: 0.8, educationalSignal: 0.6, metadataProbability: 0.1, testability: 0.7, noise: 0, sectionQuality: 0.7 },
      charCount: 800,
      mappedScore: null,
    });
    assert.deepEqual(decision, { status: "parked", reason: "unmapped" });
  });
  it("the ladder order is role → section → language → noise → metadata → quality → size → dup", () => {
    const base = {
      documentRole: "knowledge" as const,
      sectionRole: "content" as const,
      language: "pt",
      scores: { contentDensity: 0.8, educationalSignal: 0.6, metadataProbability: 0.1, testability: 0.7, noise: 0, sectionQuality: 0.7 },
      charCount: 800,
      mappedScore: 0.9,
    };
    assert.equal(decideEligibility({ ...base, documentRole: "specification" }).reason, "role");
    assert.equal(decideEligibility({ ...base, sectionRole: "nav" }).reason, "section_role");
    assert.equal(decideEligibility({ ...base, language: "es" }).reason, "language");
    assert.equal(decideEligibility({ ...base, language: "en", allowEnglish: true }).status, "eligible");
    assert.equal(decideEligibility({ ...base, scores: { ...base.scores, noise: 0.5 } }).reason, "noise");
    assert.equal(decideEligibility({ ...base, scores: { ...base.scores, metadataProbability: 0.5 } }).reason, "metadata");
    assert.equal(decideEligibility({ ...base, scores: { ...base.scores, sectionQuality: 0.2 } }).reason, "low_quality");
    assert.equal(decideEligibility({ ...base, charCount: 100 }).reason, "size");
    assert.equal(decideEligibility({ ...base, duplicateOfId: "x" }).reason, "duplicate");
    assert.equal(decideEligibility(base).status, "eligible");
  });
});
