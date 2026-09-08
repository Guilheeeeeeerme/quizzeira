import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inferExamIdentity, pickSubjectForDeposit } from "./exam-identity.js";

describe("inferExamIdentity", () => {
  it("builds a Transpetro / Cesgranrio slug from guidelines", () => {
    const id = inferExamIdentity({
      topicTitle: "PSP Terra",
      guidelines: `Órgão / concurso: Transpetro
Cargo / vaga / ênfase (obrigatório se o edital tiver várias): Administração
Estilo da banca: Cesgranrio`,
      focusText: "Administração",
    });
    assert.match(id.examSlug, /transpetro/);
    assert.match(id.examSlug, /cesgranrio/);
    assert.match(String(id.emphasis), /Administra/);
  });

  it("falls back to topic title when org unknown", () => {
    const id = inferExamIdentity({
      topicTitle: "My custom exam prep",
      guidelines: "Subjects: math",
    });
    assert.equal(id.examSlug, "my-custom-exam-prep");
  });
});

describe("pickSubjectForDeposit", () => {
  it("prefers focus when it matches a syllabus subject", () => {
    assert.equal(
      pickSubjectForDeposit(["Português", "Administração"], "Administração"),
      "Administração",
    );
  });
});
