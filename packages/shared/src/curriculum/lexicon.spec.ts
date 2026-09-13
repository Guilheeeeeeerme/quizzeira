import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalize, getSubjectById, isLegalSubject, SUBJECT_LEXICON } from "./lexicon.js";

describe("subject lexicon", () => {
  it("loads canonical subjects from YAML", () => {
    assert.ok(SUBJECT_LEXICON.length >= 10);
    assert.ok(SUBJECT_LEXICON.some((s) => s.canonical === "Língua Portuguesa"));
  });

  it("canonicalizes aliases", () => {
    assert.equal(canonicalize("Português")?.canonical, "Língua Portuguesa");
    assert.equal(canonicalize("Direito Administrativo")?.id, "direito-administrativo");
    assert.equal(canonicalize("Raciocínio Lógico-Matemático")?.canonical, "Raciocínio Lógico");
  });

  it("returns null for unknown labels", () => {
    assert.equal(canonicalize("Matéria Inventada XYZ"), null);
  });

  it("flags legal subjects", () => {
    const admin = getSubjectById("direito-administrativo");
    assert.ok(admin);
    assert.equal(isLegalSubject(admin!), true);
    assert.equal(isLegalSubject("lingua-portuguesa"), false);
  });
});
