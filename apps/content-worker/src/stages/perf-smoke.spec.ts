// Concept: §41.7 performance smoke — classify+score+map over 1k sections.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalizeSubject } from "@quizzeira/shared";
import { classifyDocument } from "./classify.js";
import { computeSectionScores } from "./scoring.js";
import { normalizeHtmlFallback } from "./normalize.js";
import { mapChunksLexical } from "./knowledge/mapping.js";

describe("perf smoke §41.7", () => {
  it("classifies + scores + maps 1000 synthetic sections in <5s", () => {
    const paragraphs = Array.from({ length: 1000 }, (_, i) => {
      const subject = i % 3 === 0 ? "Concordância verbal" : i % 3 === 1 ? "Licitações" : "Ortografia";
      return `<h2>${subject} ${i}</h2><p>Define-se o tópico ${i} como material educacional com regra, exemplo e aplicação. Art. ${i % 50} estabelece a norma aplicável ao caso concreto em concursos públicos.</p>`;
    }).join("\n");
    const html = `<html><body><h1>Apostila</h1>${paragraphs}</body></html>`;
    const doc = normalizeHtmlFallback({
      documentId: "perf-1k",
      contentType: "text/html",
      bytes: Buffer.from(html, "utf8"),
    });

    const t0 = Date.now();
    const classified = classifyDocument(doc, { roleHint: "knowledge" });
    for (const section of classified.sections) {
      computeSectionScores(section.section.text);
    }
    const leaves = classified.sections.slice(0, 50).map((s, i) => {
      const title = s.section.heading ?? `leaf-${i}`;
      const canonical = canonicalizeSubject(title);
      return {
        id: `leaf-${i}`,
        title,
        pathSlug: `perf/${i}`,
        canonicalKey: canonical?.id ?? `perf-${i}`,
        canonicalSubjectId: canonical?.id ?? null,
      };
    });
    mapChunksLexical(
      classified.sections.slice(0, 200).map((s, i) => ({
        ordinal: i,
        sectionId: s.section.id ?? `s-${i}`,
        sectionRole: s.role,
        text: s.section.text,
        tokenCount: Math.ceil(s.section.charCount / 4),
        contentHash: `h-${i}`,
      })),
      leaves,
    );
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 5000, `expected <5s, took ${elapsed}ms`);
  });
});
