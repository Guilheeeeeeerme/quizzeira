import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { chunkSections } from "./chunker";
import { cleanBlocks, htmlToBlocks, normalizeHtml, normalizePlainText } from "./html-normalize";
import { safeParseNormalizedDocument, normalizedDocumentJsonSchema } from "./normalized-document";
import { buildSections, detectHeading, sectionsText } from "./sectioner";
import type { Block } from "./normalized-document";

describe("sectioner (§13.2)", () => {
  it("assigns outline levels from numeric, roman and letter markers", () => {
    const p = (text: string): Block => ({ type: "paragraph", text });
    assert.equal(detectHeading(p("1. DAS DISPOSIÇÕES PRELIMINARES"), null)?.level, 1);
    assert.equal(detectHeading(p("1.1 DAS VAGAS"), null)?.level, 2);
    assert.equal(detectHeading(p("II - DOS REQUISITOS"), null)?.level, 1);
    assert.equal(detectHeading(p("A) DOCUMENTAÇÃO"), null)?.level, 3);
    assert.equal(detectHeading(p("ANEXO II – CONTEÚDO PROGRAMÁTICO"), null)?.level, 1);
    assert.equal(detectHeading(p("1.1 O concurso será regido por este edital e pela legislação."), null), null);
    assert.equal(detectHeading({ type: "heading", level: 3, text: "Sujeito composto" }, null)?.level, 3);
  });

  it("treats Art. N as a legal article section that keeps its own text", () => {
    const blocks: Block[] = [
      { type: "heading", level: 1, text: "CAPÍTULO I – DISPOSIÇÕES GERAIS" },
      { type: "paragraph", text: "Art. 1º Esta Lei estabelece normas gerais de licitação." },
      { type: "paragraph", text: "§ 1º Aplica-se a todos os entes." },
      { type: "paragraph", text: "Art. 2º Esta Lei aplica-se a alienações e concessões." },
    ];
    const sections = buildSections(blocks, { documentId: "lei" });
    const articles = sections.filter((s) => s.flags.includes("legal_article"));
    assert.equal(articles.length, 2);
    assert.match(articles[0].text, /^Art\. 1º/);
    assert.match(articles[0].text, /§ 1º/);
    assert.deepEqual(articles[1].path, ["CAPÍTULO I – DISPOSIÇÕES GERAIS", "Art. 2º Esta Lei aplica-se a alienações e concessões."]);
  });

  it("uses font size tiers when no markers exist and keeps nested paths", () => {
    const blocks: Block[] = [
      { type: "paragraph", text: "Concordância verbal", fontStats: { size: 18 } },
      { type: "paragraph", text: "O verbo concorda com o sujeito em número e pessoa.", fontStats: { size: 11 } },
      { type: "paragraph", text: "Sujeito composto", fontStats: { size: 14 } },
      { type: "paragraph", text: "Com sujeito composto anteposto, o verbo vai para o plural.", fontStats: { size: 11 } },
      { type: "paragraph", text: "Verbos impessoais", fontStats: { size: 14 } },
      { type: "paragraph", text: "Haver no sentido de existir fica no singular.", fontStats: { size: 11 } },
    ];
    const sections = buildSections(blocks, { documentId: "d" });
    assert.deepEqual(sections.map((s) => s.path), [
      ["Concordância verbal"],
      ["Concordância verbal", "Sujeito composto"],
      ["Concordância verbal", "Verbos impessoais"],
    ]);
  });

  it("sectioning preserves text (property §41.6)", () => {
    const blocks: Block[] = [
      { type: "paragraph", text: "Preâmbulo sem título." },
      { type: "heading", level: 1, text: "Título" },
      { type: "paragraph", text: "Corpo um." },
      { type: "paragraph", text: "Corpo dois." },
      { type: "paragraph", text: "12", flags: ["page_artifact"] },
    ];
    const sections = buildSections(blocks, { documentId: "d" });
    assert.equal(sectionsText(sections), "Preâmbulo sem título.\n\nCorpo um.\n\nCorpo dois.");
  });
});

describe("html normaliser (§13.1)", () => {
  it("strips nav/header/footer/script and measures link density", () => {
    const html = `<html><head><title>T</title><script>var x=1</script></head><body>
      <nav><a href="/a">Início</a><a href="/b">Contato</a></nav>
      <div class="cookie-banner">Aceitar cookies</div>
      <h1>Crase</h1>
      <p>Crase é a fusão da preposição a com o artigo a. Por exemplo: "Vou à escola".</p>
      <p><a href="/x">Leia mais</a> <a href="/y">Veja também</a></p>
      <table><tr><th>Cargo</th><th>Vagas</th></tr><tr><td>Analista</td><td>10</td></tr></table>
      <footer><a href="/">Voltar</a></footer></body></html>`;
    const { blocks, tables } = htmlToBlocks(html);
    assert.ok(!blocks.some((b) => /Início|Aceitar cookies|Voltar|var x/.test(b.text)));
    assert.equal(tables.length, 1);
    assert.deepEqual(tables[0].rows, [["Cargo", "Vagas"], ["Analista", "10"]]);
    const { blocks: cleaned, log } = cleanBlocks(blocks);
    const linkBlock = cleaned.find((b) => /Leia mais/.test(b.text));
    assert.ok(linkBlock?.flags?.includes("boilerplate"));
    assert.ok(log.find((l) => l.step === "link_density_filter")?.removed === 1);
    const doc = normalizeHtml({ html, documentId: "d", url: "https://x/y" });
    assert.equal(doc.metadata.title, "T");
    assert.equal(doc.stats.language, "pt");
    assert.ok(doc.stats.linkDensity > 0 && doc.stats.linkDensity < 0.5);
    assert.ok(doc.sections.some((s) => s.heading === "Crase"));
    assert.equal(safeParseNormalizedDocument(doc).ok, true);
  });

  it("flags page numbers and repeated running headers", () => {
    const text = ["Página 1", "Corpo A.", "Página 2", "TRIBUNAL DE CONTAS – EDITAL", "Corpo B.", "TRIBUNAL DE CONTAS – EDITAL", "Corpo C.", "TRIBUNAL DE CONTAS – EDITAL", "3"].join("\n\n");
    const doc = normalizePlainText({ text, documentId: "d" });
    const flagged = doc.blocks.filter((b) => b.flags?.length);
    assert.equal(flagged.filter((b) => b.flags?.includes("page_artifact")).length, 3);
    assert.equal(flagged.filter((b) => b.flags?.includes("boilerplate")).length, 3);
    assert.equal(sectionsText(doc.sections), "Corpo A.\n\nCorpo B.\n\nCorpo C.");
  });

  it("rejects an invalid NormalizedDocument at the boundary and exports JSON schema", () => {
    const bad = safeParseNormalizedDocument({ schemaVersion: "1", documentId: "x" });
    assert.equal(bad.ok, false);
    const schema = normalizedDocumentJsonSchema();
    assert.equal(typeof schema, "object");
    assert.ok("properties" in schema);
  });
});

describe("section-aware chunker (§22.1, §40.3)", () => {
  const long = (n: number, topic = "concordância") => Array.from({ length: n }, (_, i) => `Frase número ${i + 1} explica uma regra de ${topic} com detalhe suficiente para ser útil.`).join(" ");
  const blocks: Block[] = [
    { type: "heading", level: 1, text: "Concordância" },
    { type: "paragraph", text: long(30) },
    { type: "paragraph", text: long(30) },
    { type: "heading", level: 2, text: "Sujeito composto" },
    { type: "paragraph", text: "Curto." },
    { type: "heading", level: 2, text: "Verbos impessoais" },
    { type: "paragraph", text: "Também curto." },
    { type: "heading", level: 1, text: "Crase" },
    { type: "paragraph", text: long(10, "crase") },
  ];
  const sections = buildSections(blocks, { documentId: "d" });
  const chunks = chunkSections(sections, { targetChars: 1500, minChars: 300, maxChars: 4000 });

  it("never crosses a section boundary and respects the target size", () => {
    for (const chunk of chunks) {
      assert.ok(chunk.charCount <= 4000);
      const sectionsInChunk = new Set(sections.filter((s) => chunk.text.includes(s.text.slice(0, 40))).map((s) => s.path[0]));
      assert.ok(sectionsInChunk.size <= 1, `chunk spans ${[...sectionsInChunk].join(", ")}`);
    }
    assert.ok(chunks.filter((c) => c.sectionPath[0] === "Concordância").length >= 2);
  });

  it("merges tiny sibling sections under the same parent and hashes digit-insensitively", () => {
    const merged = chunks.find((c) => /Sujeito composto/.test(c.text) && /Verbos impessoais/.test(c.text));
    assert.ok(merged, "small siblings were not merged");
    const a = chunkSections([{ ...sections[0], text: "Página 12 do edital de 2026." }])[0];
    const b = chunkSections([{ ...sections[0], text: "Página 13 do edital de 2025." }])[0];
    assert.equal(a.contentHash, b.contentHash);
    assert.ok(a.tokenCount > 0);
  });

  it("skips boilerplate and garbage sections", () => {
    const out = chunkSections([{ ...sections[0], flags: ["boilerplate"] }, { ...sections[1], flags: ["garbage"] }]);
    assert.equal(out.length, 0);
  });
});
