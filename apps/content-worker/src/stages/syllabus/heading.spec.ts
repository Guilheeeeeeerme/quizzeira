// Concept: Syllabus subject heading resolution for golden leaf tips (§15 / §42).

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyDocument } from "../classify.js";
import { normalizeHtmlFallback } from "../normalize.js";
import { parseSyllabusFromDocument } from "./parse.js";
import { discoverPositions } from "./positions.js";

function parseHtml(html: string) {
  const doc = normalizeHtmlFallback({
    documentId: "t",
    contentType: "text/html",
    bytes: Buffer.from(html, "utf8"),
  });
  // normalizeHtmlFallback already returns NormalizedDocument — no cast needed.
  const classified = classifyDocument(doc, {
    kindHint: "edital",
    roleHint: "specification",
  });
  const positions = discoverPositions(doc, classified.sections);
  return parseSyllabusFromDocument(doc, classified.sections, positions);
}

describe("syllabus heading subjects", () => {
  it("maps Português alias and keeps list tips", () => {
    const html = `<html><body>
      <h2>Conteúdo Programático</h2>
      <h3>Português</h3>
      <ul><li>Ortografia oficial</li><li>Concordância nominal</li></ul>
    </body></html>`;
    const parsed = parseHtml(html);
    const titles = parsed.nodes.map((n) => n.title.toLowerCase());
    assert.ok(titles.some((t) => t.includes("portugu") || t.includes("língua") || t.includes("lingua")));
    assert.ok(titles.some((t) => t.includes("ortografia")));
    assert.ok(titles.some((t) => t.includes("concordância") || t.includes("concordancia")));
  });

  it("accepts free-text Controle Externo headings", () => {
    const html = `<html><body>
      <h2>Conteúdo Programático</h2>
      <h3>Controle Externo</h3>
      <ul><li>Competências dos Tribunais de Contas</li><li>Tomada e prestação de contas</li></ul>
    </body></html>`;
    const parsed = parseHtml(html);
    const titles = parsed.nodes.map((n) => n.title.toLowerCase());
    assert.ok(titles.some((t) => t.includes("controle externo")));
    assert.ok(titles.some((t) => t.includes("tribunais de contas")));
  });

  it("does not promote tip 'Atos administrativos' into a subject node alone", () => {
    const html = `<html><body>
      <h2>Conteúdo Programático</h2>
      <h3>Direito Administrativo</h3>
      <ul><li>Atos administrativos</li><li>Licitações (Lei 14.133/2021)</li></ul>
    </body></html>`;
    const parsed = parseHtml(html);
    const depth0 = parsed.nodes.filter((n) => n.depth === 0).map((n) => n.title.toLowerCase());
    assert.equal(depth0.filter((t) => t === "atos administrativos").length, 0);
    assert.ok(parsed.nodes.some((n) => /atos administrativos/i.test(n.title) && n.depth >= 1));
  });
});
