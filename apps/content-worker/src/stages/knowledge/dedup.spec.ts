import assert from "node:assert/strict";
import { materialMentionsLeaf } from "./distill.js";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { dedupeChunks } from "./dedup.js";

function draft(ordinal: number, text: string) {
  return {
    sectionId: "s",
    sectionRole: "content" as const,
    ordinal,
    text,
    tokenCount: Math.ceil(text.length / 4),
    contentHash: createHash("sha256").update(text).digest("hex"),
  };
}

test("dedupeChunks links exact and near duplicates to the first canonical chunk", () => {
  const base =
    "O mandado de segurança protege direito líquido e certo não amparado por habeas corpus ou habeas data, " +
    "quando o responsável pela ilegalidade for autoridade pública. O prazo decadencial é de cento e vinte dias.";
  const near = base.replace("cento e vinte dias", "cento e vinte dias, contados da ciência");
  const other =
    "A ação popular pode ser proposta por qualquer cidadão para anular ato lesivo ao patrimônio público, " +
    "à moralidade administrativa, ao meio ambiente e ao patrimônio histórico e cultural.";
  const { chunks } = dedupeChunks([draft(0, base), draft(1, base), draft(2, near), draft(3, other)]);
  assert.deepEqual(
    chunks.map((c) => c.duplicateOfOrdinal),
    [null, 0, 0, null],
  );
});

test("dedupeChunks stays fast on hundreds of chunks", () => {
  const drafts = Array.from({ length: 400 }, (_, i) =>
    draft(i, `Tema ${i}: ${"conteúdo jurídico distinto ".repeat(60)} número ${i * 7919}`),
  );
  const started = Date.now();
  dedupeChunks(drafts);
  assert.ok(Date.now() - started < 5000);
});

test("distill lexical gate: material must mention the leaf", () => {
  const chunks = [{ text: "A concordância verbal exige que o verbo concorde com o sujeito em número e pessoa." }];
  assert.equal(materialMentionsLeaf(chunks, ["Língua Portuguesa", "Concordância verbal e nominal"]), true);
  assert.equal(materialMentionsLeaf(chunks, ["Arquitetura Naval", "Principais compartimentos da embarcação"]), false);
});
