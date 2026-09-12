import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deflateSync } from "node:zlib";
import { extractLayoutText, pageToText, readPositionedText } from "./pdf-layout";

function show(x: number, y: number, text: string): string {
  return `BT 1 0 0 1 ${x} ${y} Tm (${text}) Tj ET`;
}

function pdf(objects: string[]): Buffer {
  return Buffer.from(`%PDF-1.4\n${objects.join("\n")}\n%%EOF`, "latin1");
}

function streamObject(number: number, content: string): string {
  const compressed = deflateSync(Buffer.from(content, "latin1")).toString("latin1");
  return `${number} 0 obj\n<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n${compressed}\nendstream\nendobj`;
}

describe("readPositionedText", () => {
  it("keeps the position of every fragment", () => {
    const items = readPositionedText(show(72, 700, "Questao"));
    assert.deepEqual(items, [{ x: 72, y: 700, text: "Questao" }]);
  });

  it("follows Td, TD and T* line moves", () => {
    const items = readPositionedText("BT 1 0 0 1 72 700 Tm (a) Tj 0 -12 Td (b) Tj T* (c) Tj ET");
    assert.deepEqual(
      items.map((i) => [i.y, i.text]),
      [
        [700, "a"],
        [688, "b"],
        [688, "c"],
      ],
    );
  });

  it("decodes a subset font through its ToUnicode CMap", () => {
    const fonts = new Map([
      ["R9", { codeByteLength: 1, map: new Map([[3, "C"], [4, "D"]]) }],
    ]);
    // Glyph indices, not characters: without the CMap this reads as control bytes.
    const items = readPositionedText("BT /R9 11 Tf (\\003\\004) Tj ET", fonts);
    assert.equal(items[0].text, "CD");
  });

  it("leaves WinAnsi text alone when the font has no CMap", () => {
    const items = readPositionedText("BT /F1 11 Tf (Gabarito) Tj ET", new Map());
    assert.equal(items[0].text, "Gabarito");
  });
});

describe("pageToText", () => {
  const twoColumns = {
    index: 0,
    items: [
      { x: 60, y: 700, text: "coluna esquerda linha 1" },
      { x: 60, y: 688, text: "coluna esquerda linha 2" },
      { x: 320, y: 700, text: "coluna direita linha 1" },
      { x: 320, y: 688, text: "coluna direita linha 2" },
    ],
  };

  it("reads column by column, not across the page", () => {
    assert.equal(
      pageToText(twoColumns, { minItemsPerColumn: 2 }),
      [
        "coluna esquerda linha 1",
        "coluna esquerda linha 2",
        "coluna direita linha 1",
        "coluna direita linha 2",
      ].join("\n"),
    );
  });

  it("joins fragments that share a line, left to right", () => {
    const page = {
      index: 0,
      items: [
        { x: 120, y: 700, text: "undo" },
        { x: 60, y: 700, text: "Seg" },
      ],
    };
    assert.equal(pageToText(page), "Segundo");
  });

  it("falls back to one block when a column is too thin to be real", () => {
    // Same page, read without the column split: the two columns interleave on
    // every line, which is exactly the damage the split exists to prevent.
    const lines = pageToText(twoColumns, { minItemsPerColumn: 5 }).split("\n");
    assert.equal(lines.length, 2);
    assert.equal(lines[0], "coluna esquerda linha 1coluna direita linha 1");
  });
});

describe("extractLayoutText", () => {
  it("separates pages with a form feed", () => {
    const text = extractLayoutText(
      pdf([streamObject(4, show(72, 700, "Pagina um")), streamObject(5, show(72, 700, "Pagina dois"))]),
    );
    assert.equal(text, "Pagina um\n\f\nPagina dois");
  });

  it("returns empty text for an image-only PDF rather than throwing", () => {
    assert.equal(extractLayoutText(pdf([streamObject(4, "q 100 0 0 100 0 0 cm /Im1 Do Q")])), "");
  });
});
