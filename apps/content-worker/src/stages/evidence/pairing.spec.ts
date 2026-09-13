// Concept: Evidence pairing prefers year/booklet/phase when multiple gabaritos exist (§18.2).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { evidencePairKey, findMatchingGabarito } from "./pairing.js";

describe("evidence pairing (§18.2)", () => {
  it("extracts year / booklet / phase from prova text", () => {
    const key = evidencePairKey(
      {
        id: "p1",
        examSlug: "cespe-2024-analista",
        kind: "prova",
        sourceUrl: "https://example.test/prova-2024-tipo-azul.pdf",
      },
      "Prova objetiva — Tipo Azul — Cargo: Analista",
    );
    assert.equal(key.year, 2024);
    assert.match(key.bookletType ?? "", /azul|tipo/i);
    assert.equal(key.phase, "objective");
    assert.match(key.position, /Analista/i);
  });

  it("prefers gabarito matching year + booklet among same-exam candidates", () => {
    const prova = {
      id: "prova-1",
      examSlug: "fgv-analista",
      kind: "prova",
      sourceUrl: "https://cdn.test/fgv/2023/prova-tipo-1.pdf",
    };
    const docs = [
      {
        id: "gab-old",
        examSlug: "fgv-analista",
        kind: "gabarito",
        sourceUrl: "https://cdn.test/fgv/2021/gabarito-tipo-2.pdf",
      },
      {
        id: "gab-match",
        examSlug: "fgv-analista",
        kind: "gabarito",
        sourceUrl: "https://cdn.test/fgv/2023/gabarito-tipo-1.pdf",
      },
      {
        id: "gab-other-exam",
        examSlug: "other",
        kind: "gabarito",
        sourceUrl: "https://cdn.test/other/2023/gabarito.pdf",
      },
    ];
    const hit = findMatchingGabarito(prova, docs, "Prova Tipo 1 — ano 2023");
    assert.equal(hit?.id, "gab-match");
  });
});
