import assert from "node:assert/strict";
import { test } from "node:test";
import { extractEvidenceMetaFromText, pairEvidence } from "./pairing.js";

test("pairEvidence matches prova to gabarito by year and exam", () => {
  const pairs = pairEvidence([
    {
      id: "p1",
      kind: "prova",
      examSlug: "tce-go-2024",
      year: 2024,
      position: "Analista",
      phase: "objetiva",
      bookletType: "Tipo 1",
    },
    {
      id: "g1",
      kind: "gabarito",
      examSlug: "tce-go-2024",
      year: 2024,
      position: "Analista",
      phase: "objetiva",
      bookletType: "Tipo 1",
    },
    {
      id: "g2",
      kind: "gabarito",
      examSlug: "other",
      year: 2020,
    },
  ]);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].provaId, "p1");
  assert.equal(pairs[0].gabaritoId, "g1");
  assert.ok(pairs[0].score >= 0.55);
});

test("extractEvidenceMetaFromText pulls year and cargo", () => {
  const meta = extractEvidenceMetaFromText(
    "Concurso 2024 — Cargo: Técnico Judiciário — Prova objetiva Tipo 2",
    { id: "d1", kind: "prova", examSlug: "x" },
  );
  assert.equal(meta.year, 2024);
  assert.match(meta.position ?? "", /Técnico/i);
  assert.ok(meta.bookletType);
});
