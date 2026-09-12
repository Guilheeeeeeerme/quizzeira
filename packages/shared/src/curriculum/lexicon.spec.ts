import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalKey, canonicalizeSubject, isLegalSubject, looksLikeSubjectHeader, CANONICAL_SUBJECTS } from "./lexicon";
import { buildTopicQueries, extractNormReference } from "./queries";
import { stemPt, termSet } from "./stem-pt";
import { guessLanguage, orderedOptionMarkers, syllabusListShape } from "./text-stats";
import { ratio, tokenOverlap, tokenSetRatio, tokenSortRatio } from "../fuzzy";

describe("subject lexicon (§15.5)", () => {
  it("has unique ids and at least 60 subjects", () => {
    const ids = CANONICAL_SUBJECTS.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 60, `${ids.length} subjects`);
  });
  it("canonicalises exact, alias and fuzzy wording", () => {
    assert.equal(canonicalizeSubject("Língua Portuguesa")?.method, "exact");
    assert.equal(canonicalizeSubject("PORTUGUÊS:")?.id, "lingua-portuguesa");
    assert.equal(canonicalizeSubject("Noções de Informática")?.id, "nocoes-de-informatica");
    assert.equal(canonicalizeSubject("Raciocínio Lógico-Matemático")?.id, "raciocinio-logico");
    const fuzzy = canonicalizeSubject("Noções de Direito Administrativo");
    assert.equal(fuzzy?.id, "direito-administrativo");
    assert.equal(canonicalizeSubject("Legislação do TCE-GO"), null);
    assert.equal(canonicalizeSubject("TI")?.id, "tecnologia-da-informacao");
    assert.equal(canonicalizeSubject("XY"), null);
    assert.equal(canonicalizeSubject(""), null);
  });
  it("builds canonical keys and recognises subject headers", () => {
    assert.equal(canonicalKey("lingua-portuguesa", "Concordância verbal"), "lingua-portuguesa:concordancia-verbal");
    assert.match(canonicalKey(null, "Lei Orgânica", "Legislação do TCE-GO"), /^raw-legislacao-do-tce-go:lei-organica$/);
    assert.equal(isLegalSubject("direito-administrativo"), true);
    assert.equal(isLegalSubject("matematica"), false);
    assert.equal(looksLikeSubjectHeader("LÍNGUA PORTUGUESA:"), true);
    assert.equal(looksLikeSubjectHeader("Direito Constitucional"), true);
    assert.equal(looksLikeSubjectHeader("1.1 Compreensão e interpretação de textos"), false);
  });
});

describe("topic queries (§17.2)", () => {
  it("builds ≤ 3 deterministic queries with family templates", () => {
    const q = buildTopicQueries({
      subject: { id: "lingua-portuguesa", canonical: "Língua Portuguesa" },
      topic: { title: "Sintaxe" },
      leaf: { title: "Concordância verbal", rawText: "Concordância verbal" },
    });
    assert.equal(q.length, 3);
    assert.equal(q[0], "Concordância verbal Língua Portuguesa regras");
    assert.ok(q.every((s) => /Concordância verbal/.test(s)));
  });
  it("routes legal leaves that cite a norm to a direct reference", () => {
    const q = buildTopicQueries({
      subject: { id: "direito-administrativo", canonical: "Direito Administrativo" },
      topic: { title: "Licitações" },
      leaf: { title: "Modalidades", rawText: "Modalidades de licitação (Lei nº 14.133/2021)" },
    });
    assert.equal(q[0], "Lei 14.133/2021");
    assert.equal(extractNormReference("Súmula Vinculante nº 13"), "Súmula Vinculante 13");
    assert.equal(extractNormReference("Decreto-Lei 5.452/1943"), "Decreto-Lei 5.452/1943");
    assert.equal(extractNormReference("Ortografia oficial"), null);
  });
});

describe("pt stemmer and text stats", () => {
  it("collapses inflections so lexical mapping matches", () => {
    assert.equal(stemPt("concordâncias"), stemPt("concordância"));
    assert.equal(stemPt("verbais"), stemPt("verbal"));
    assert.equal(stemPt("licitações"), stemPt("licitação"));
    assert.deepEqual([...termSet("A concordância verbal e a nominal")].sort(), [...termSet("concordâncias verbais nominais")].sort());
  });
  it("detects option runs, syllabus shape and language", () => {
    assert.equal(orderedOptionMarkers("a) x\nb) y\nc) z\nd) w\ne) v"), 1);
    assert.equal(orderedOptionMarkers("a) x\nc) y"), 0);
    assert.ok(syllabusListShape("1. Ortografia. 2. Acentuação. 3. Crase. 4. Pontuação.") >= 0.6);
    assert.ok(syllabusListShape("O verbo concorda com o sujeito. Isso vale para toda oração declarativa longa que explica a regra com calma.") < 0.4);
    assert.equal(guessLanguage("O candidato deverá comparecer com documento de identificação para a prova."), "pt");
    assert.equal(guessLanguage("The candidate must bring an ID document to the exam and this is required for all."), "en");
    assert.equal(guessLanguage("Los candidatos deben presentar el documento en la sede del examen y hay muy pocas excepciones."), "es");
    assert.equal(guessLanguage("12345"), "und");
  });
});

describe("fuzzy (rapidfuzz-style)", () => {
  it("token set ratio ignores order and extra tokens", () => {
    assert.equal(tokenSetRatio("Língua Portuguesa", "portuguesa lingua"), 100);
    assert.equal(tokenSetRatio("Noções de Direito Administrativo", "Direito Administrativo"), 100);
    assert.ok(tokenSetRatio("Direito Administrativo", "Direito Constitucional") < 80);
    assert.ok(tokenSortRatio("b a", "a b") === 100);
    assert.equal(ratio("abc", "abc"), 100);
    assert.equal(tokenOverlap("a b c", "a c"), 2 / 3);
  });
});
