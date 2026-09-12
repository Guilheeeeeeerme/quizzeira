import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateGrounding } from "./grounding.js";

describe("validateGrounding", () => {
  it("rejects missing evidence", () => {
    const r = validateGrounding({
      prompt: "O que é concordância verbal?",
      options: ["a", "b", "c", "d", "e"],
      correctIndex: 0,
      evidenceTexts: [],
    });
    assert.equal(r.ok, false);
  });

  it("accepts overlapping knowledge evidence", () => {
    const r = validateGrounding({
      prompt: "Com sujeito composto anteposto ao verbo, o verbo vai para o plural.",
      options: ["Verdadeiro", "Falso", "Depende", "Nunca", "Sempre singular"],
      correctIndex: 0,
      explanation: "Regra de concordância verbal com sujeito composto.",
      evidenceTexts: [
        "Com sujeito composto anteposto ao verbo, o verbo vai para o plural. Concordância verbal.",
      ],
    });
    assert.equal(r.ok, true);
  });
});
