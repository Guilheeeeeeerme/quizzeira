import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyOabDocument,
  oabEditionByNumber,
  oabExamSlug,
  oabSubjectForQuestion,
  parseOabEdition,
  parseOabPracticalArea,
  preferDefinitiveOabDocuments,
  type OabClassifiedDocument,
} from "./oab";

describe("parseOabEdition", () => {
  it("reads the Arabic labels used from the 35º on", () => {
    assert.equal(parseOabEdition("46º EXAME DE ORDEM UNIFICADO")?.fgvKey, 649);
    assert.equal(parseOabEdition("47 Exame de Ordem Unificado")?.label, "47º");
  });

  it("reads the Roman labels used up to the XXXIV", () => {
    assert.equal(parseOabEdition("XXXIV Exame Civil - SEGUNDA FASE")?.number, 34);
  });

  it("reads the 2010 labels, which predate the numbering", () => {
    assert.equal(parseOabEdition("EXAME DE ORDEM UNIFICADO 2010.2")?.number, 1);
  });

  it("does not invent an edition from unrelated text", () => {
    assert.equal(parseOabEdition("Resultado final"), null);
    // "V" is a Roman numeral and also an ordinary initial: only trust it when
    // the edition it resolves to is actually labelled that way.
    assert.equal(parseOabEdition("Prova V Exame")?.label, "V");
    assert.equal(parseOabEdition("Comunicado sobre a prova"), null);
  });
});

describe("parseOabPracticalArea", () => {
  it("prefers FGV's booklet code over the accent-mangled area name", () => {
    assert.equal(parseOabPracticalArea("OAB46 - B002 (DIREITO CIVIL)")?.slug, "direito-civil");
  });

  it("falls back to the area name", () => {
    assert.equal(parseOabPracticalArea("Padrão de respostas (Direito do Trabalho)")?.code, "B007");
  });

  it("finds the área deep inside a cover page", () => {
    const cover = `${"Instruções ao candidato. ".repeat(40)}Caderno de Provas (Direito Penal)`;
    assert.equal(parseOabPracticalArea(cover)?.code, "B005");
  });

  it("returns null for an area the 2ª fase does not offer", () => {
    assert.equal(parseOabPracticalArea("Direito Previdenciário"), null);
  });
});

describe("classifyOabDocument", () => {
  it("classifies a 1ª fase booklet with its type", () => {
    const doc = classifyOabDocument("Caderno de Prova - Tipo 1 - Branca");
    assert.equal(doc?.kind, "prova");
    assert.equal(doc?.phase, "objective");
    assert.equal(doc?.bookletType, 1);
  });

  it("classifies both gabarito variants and flags the definitive one", () => {
    assert.equal(
      classifyOabDocument("Gabaritos Preliminares da Prova Objetiva (1ª Fase)")?.definitive,
      false,
    );
    const definitive = classifyOabDocument("Gabaritos definitivos da prova objetiva (1ª fase)");
    assert.equal(definitive?.kind, "gabarito");
    assert.equal(definitive?.phase, "objective");
    assert.equal(definitive?.definitive, true);
  });

  it("classifies a 2ª fase booklet and its padrão by área", () => {
    const caderno = classifyOabDocument("Caderno de Provas (Direito Penal)");
    assert.equal(caderno?.phase, "practical");
    assert.equal(caderno?.area?.code, "B005");

    const padrao = classifyOabDocument("Padrão de respostas definitivo (Direito Tributário)");
    assert.equal(padrao?.kind, "gabarito");
    assert.equal(padrao?.area?.code, "B006");
    assert.equal(padrao?.definitive, true);
  });

  it("keeps the edital but drops the administrative rows", () => {
    assert.equal(classifyOabDocument("Edital de abertura")?.kind, "edital");
    assert.equal(classifyOabDocument("Edital - Locais de Prova (1ª fase)"), null);
    assert.equal(classifyOabDocument("Resultado preliminar da 1ª fase"), null);
    assert.equal(classifyOabDocument("Comunicado aos candidatos"), null);
  });

  it("reads the área out of the href when the label omits it", () => {
    const doc = classifyOabDocument(
      "Caderno de Provas",
      "http://oab.fgv.br/arq/649/1048576_OAB46%20-%20B004.pdf",
    );
    assert.equal(doc?.area?.slug, "direito-empresarial");
  });
});

describe("preferDefinitiveOabDocuments", () => {
  const doc = (label: string, url: string): OabClassifiedDocument => {
    const parsed = classifyOabDocument(label, url);
    assert.ok(parsed, `expected ${label} to classify`);
    return { ...parsed, label, url };
  };

  it("drops the preliminary key when the definitive one is published", () => {
    const kept = preferDefinitiveOabDocuments([
      doc("Gabaritos Preliminares da Prova Objetiva (1ª Fase)", "a.pdf"),
      doc("Gabaritos definitivos da prova objetiva (1ª fase)", "b.pdf"),
    ]);
    assert.equal(kept.length, 1);
    assert.equal(kept[0].url, "b.pdf");
  });

  it("keeps the preliminary key while it is the only one", () => {
    const kept = preferDefinitiveOabDocuments([
      doc("Gabaritos Preliminares da Prova Objetiva (1ª Fase)", "a.pdf"),
    ]);
    assert.equal(kept.length, 1);
  });

  it("keeps every booklet type and every 2ª fase área", () => {
    const kept = preferDefinitiveOabDocuments([
      doc("Caderno de Prova - Tipo 1", "t1.pdf"),
      doc("Caderno de Prova - Tipo 2", "t2.pdf"),
      doc("Padrão de respostas (Direito Civil)", "civil.pdf"),
      doc("Padrão de respostas (Direito Penal)", "penal.pdf"),
    ]);
    assert.equal(kept.length, 4);
  });
});

describe("oabSubjectForQuestion", () => {
  it("labels a Tipo 1 number from the observed blueprint", () => {
    assert.equal(oabSubjectForQuestion(1).slug, "etica-profissional");
    assert.equal(oabSubjectForQuestion(80).slug, "direito-previdenciario");
  });

  it("never claims the blueprint is official", () => {
    assert.equal(oabSubjectForQuestion(37).official, false);
  });

  it("falls back to Geral outside 1–80", () => {
    assert.equal(oabSubjectForQuestion(81).slug, "geral");
    assert.equal(oabSubjectForQuestion(0).slug, "geral");
  });
});

describe("oabExamSlug", () => {
  it("keeps the two papers in separate question pools", () => {
    const edition = oabEditionByNumber(46);
    assert.ok(edition);
    assert.equal(oabExamSlug(edition, "objective"), "oab-46-1-fase");
    assert.equal(oabExamSlug(edition, "practical"), "oab-46-2-fase");
  });
});
