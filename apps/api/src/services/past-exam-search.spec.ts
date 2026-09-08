import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMcqCandidates } from "../lib/past-exam-extract.js";

describe("extractMcqCandidates", () => {
  it("extracts numbered MCQs with gabarito", () => {
    const text = `
1) Sobre planejamento estratégico, assinale a correta.
A) Missão define só lucro
B) Visão orienta o futuro desejado
C) SWOT ignora ambiente externo
D) BSC não usa indicadores
E) Matriz BCG mede clima organizacional
Gabarito: B

2) Curto demais
A) x
B) y
`;
    const items = extractMcqCandidates(text);
    assert.equal(items.length, 1);
    assert.equal(items[0].correctIndex, 1);
    assert.equal(items[0].options?.length, 5);
  });

  it("skips blocks without gabarito", () => {
    const text = `
10) Sem resposta conhecida.
A) um
B) dois
C) três
D) quatro
E) cinco
`;
    assert.equal(extractMcqCandidates(text).length, 0);
  });
});
