import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSyllabusOutline } from "./parse.js";

describe("syllabus outline parser", () => {
  it("extracts subjects and numbered leaves", () => {
    const text = `
LÍNGUA PORTUGUESA
1. Compreensão e interpretação de textos
2. Ortografia oficial
3. Concordância verbal e nominal
MATEMÁTICA
1. Porcentagem
2. Regra de três
`;
    const nodes = parseSyllabusOutline(text);
    assert.ok(nodes.some((n) => n.depth === 0 && /portuguesa/i.test(n.title)));
    assert.ok(nodes.some((n) => /Concordância/i.test(n.title)));
    assert.ok(nodes.some((n) => /Porcentagem/i.test(n.title)));
  });
});
