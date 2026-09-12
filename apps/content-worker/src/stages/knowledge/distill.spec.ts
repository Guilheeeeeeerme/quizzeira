import assert from "node:assert/strict";
import { test } from "node:test";
import { distillKnowledgeUnits } from "./distill.js";

test("distillKnowledgeUnits extracts rules and skips short noise", () => {
  const text = `
Concordância verbal. Com sujeito composto anteposto ao verbo, o verbo vai para o plural.
Chegaram o pai e o filho. A regra exige plural quando os núcleos do sujeito precedem o verbo.
Vagas: 10. Taxa de inscrição R$ 80,00. Inscrições até 10/10/2026.
Define-se crase como a fusão da preposição a com o artigo a.
`;
  const units = distillKnowledgeUnits(text, { syllabusNodeId: "leaf-1", max: 6 });
  assert.ok(units.length >= 2);
  assert.ok(units.every((u) => u.statement.length >= 40));
  assert.ok(!units.some((u) => /taxa de inscrição/i.test(u.statement)));
  assert.ok(units.some((u) => u.kind === "rule" || u.kind === "definition" || u.kind === "fact"));
});
