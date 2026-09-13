import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { classifyHtml } from "./classify.js";

const listingHtml = readFileSync(
  resolve(__dirname, "../../../../fixtures/golden/regression/listing-trivia/listing-page.html"),
  "utf8",
);

test("listing HTML classifies as administrative", () => {
  const result = classifyHtml(listingHtml, "listing-doc", {
    kindHint: "listing",
    roleHint: "administrative",
  });
  assert.equal(result.role, "administrative");
  assert.ok(result.roleConfidence >= 0.75);
});

import { classifySectionRole } from "./classify.js";

function section(heading: string | null, text: string, flags: Array<"legal_article"> = []) {
  return {
    id: `s-${heading ?? "x"}`,
    ordinal: 0,
    path: [],
    heading,
    level: 1,
    text,
    charCount: text.length,
    blockRange: [0, 1] as [number, number],
    flags,
  };
}

test("knowledge sections keep prose as content despite exam vocabulary and page nav", () => {
  const prose =
    "O Direito Eleitoral regula o processo de escolha dos representantes. " +
    "As questões da OAB cobram a Lei 9.504/1997 e o candidato deverá conhecer a taxa de " +
    "inelegibilidade e a pontuação exigida. Trata-se de conceito recorrente na prova objetiva.";
  assert.equal(classifySectionRole(section("Conceito de Direito Eleitoral", prose), 0.9, "knowledge"), "content");
  assert.equal(classifySectionRole(section("Categorias", "Ética | Civil | Penal"), 0.9, "knowledge"), "nav");
  assert.equal(
    classifySectionRole(section("Art. 5º", "Art. 5º Todos são iguais perante a lei.", ["legal_article"]), 0, "knowledge"),
    "legal_article",
  );
  // Specification documents keep the edital-specific ladder.
  assert.equal(classifySectionRole(section("Das inscrições", "A taxa de inscrição será paga por boleto."), 0.1, "specification"), "registration");
});
