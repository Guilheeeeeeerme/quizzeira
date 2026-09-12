// Concept: Section quality scores — labelled axes (§20 / §41.1).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeSectionScores } from "./scoring.js";

describe("computeSectionScores (§41.1)", () => {
  it("legislation-with-dates content has metadataProbability < 0.35", () => {
    const text = [
      "A Lei 14.133/2021 estabelece normas gerais de licitação e contratação.",
      "Define-se licitação como o processo administrativo destinado a selecionar",
      "a proposta mais vantajosa. Por exemplo, o pregão eletrônico é uma modalidade.",
      "A regra geral exige isonomia entre os licitantes. Art. 11 lista os objetivos.",
    ].join("\n\n");
    const s = computeSectionScores(text);
    assert.ok(
      s.metadataProbability < 0.35,
      `expected meta < 0.35, got ${s.metadataProbability}`,
    );
    assert.ok(s.educationalSignal > 0, "expected educational signal");
    assert.ok(s.sectionQuality > 0, "expected positive sectionQuality");
  });

  it("Das Inscrições administrative block has metadataProbability > 0.6", () => {
    const text = [
      "DAS INSCRIÇÕES",
      "As inscrições serão realizadas exclusivamente pela internet no período de",
      "10/01/2026 a 20/01/2026. A taxa de inscrição é de R$ 95,00. O candidato",
      "deverá informar CPF, cargo pretendido e local de prova. Vagas: 120.",
      "Salário base: R$ 5.200,00. Banca organizadora: Cesgranrio.",
    ].join("\n");
    const s = computeSectionScores(text);
    assert.ok(
      s.metadataProbability > 0.6,
      `expected meta > 0.6, got ${s.metadataProbability}`,
    );
    assert.equal(s.sectionQuality, 0);
  });

  it("noise glyphs raise noise and depress sectionQuality", () => {
    const clean = "Define-se concordância como a harmonia entre sujeito e verbo.\n\n".repeat(3);
    const noisy = `${clean} @@@ ### *** ~~~ ${"§".repeat(40)}`;
    const a = computeSectionScores(clean);
    const b = computeSectionScores(noisy);
    assert.ok(b.noise > a.noise, `noise ${b.noise} vs ${a.noise}`);
  });
});
