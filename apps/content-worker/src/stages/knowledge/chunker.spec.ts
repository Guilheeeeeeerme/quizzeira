import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClassifiedSection } from "../classify.js";
import { computeSectionScores } from "../scoring.js";
import { chunkSections } from "./chunker.js";

function section(id: string, ordinal: number, text: string): ClassifiedSection {
  return {
    section: {
      id,
      ordinal,
      path: [],
      heading: `Section ${ordinal}`,
      level: 1,
      text,
      charCount: text.length,
      blockRange: [0, 0],
      flags: [],
    },
    role: "content",
    scores: computeSectionScores(text),
  };
}

describe("chunker §41.6", () => {
  it("does not cross section boundaries", () => {
    const paraA = "a".repeat(400);
    const paraB = "b".repeat(400);
    const sections = [section("sec-a", 0, paraA), section("sec-b", 1, paraB)];
    const chunks = chunkSections(sections, { maxChars: 3000, minChars: 300 });

    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      const hasA = chunk.text.includes("aaa");
      const hasB = chunk.text.includes("bbb");
      assert.notEqual(hasA && hasB, true, "chunk must not span sections");
    }
    assert.equal(chunks[0]?.sectionId, "sec-a");
    assert.equal(chunks[1]?.sectionId, "sec-b");
  });

  it("property: every chunk text is a substring of its source section only", () => {
    const markers = ["ALPHA_SECTION_MARKER", "BETA_SECTION_MARKER", "GAMMA_SECTION_MARKER"];
    const sections = markers.map((m, i) =>
      section(`sec-${i}`, i, `${m}\n\n${"conteúdo educacional ".repeat(40)}${m}`),
    );
    const chunks = chunkSections(sections, { maxChars: 800, minChars: 200 });
    assert.ok(chunks.length >= markers.length);

    for (const chunk of chunks) {
      const src = sections.find((s) => s.section.id === chunk.sectionId);
      assert.ok(src, chunk.sectionId);
      assert.ok(
        src!.section.text.includes(chunk.text.slice(0, Math.min(80, chunk.text.length))),
        "chunk must come from its section text",
      );
      for (const other of sections) {
        if (other.section.id === chunk.sectionId) continue;
        const foreign = markers.find((m) => other.section.text.includes(m));
        if (foreign) {
          assert.equal(
            chunk.text.includes(foreign),
            false,
            `chunk from ${chunk.sectionId} must not contain ${foreign}`,
          );
        }
      }
    }
  });

  it("property: packing long paragraphs still keeps a single sectionId", () => {
    const long = `${"parágrafo um. ".repeat(50)}\n\n${"parágrafo dois. ".repeat(50)}\n\n${"parágrafo três. ".repeat(50)}`;
    const sections = [section("only", 0, long)];
    const chunks = chunkSections(sections, { maxChars: 400, minChars: 100 });
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) {
      assert.equal(chunk.sectionId, "only");
    }
  });
});
