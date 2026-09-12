// Concept: Extraction (PDF → text that preserves reading order)
//
// The platform's general reader (../pdf-text.ts) concatenates text operators in
// stream order and throws away position. That is fine for an edital, but an OAB
// caderno is printed in two columns: without geometry, question 1 comes back
// spliced into question 3 and every prompt is nonsense.
//
// So this reader keeps the text matrix. It walks the same inflated content
// streams, tracks Tm/Td/TD/T*, and emits positioned fragments; those are then
// grouped into lines by y and into columns by x, and read column by column.
// Still dependency-free — no poppler, no pdf.js in the worker image.
import { inflateSync, unzipSync } from "node:zlib";
import { buildFontMap, decodeWithCMap, type FontMap } from "./cmap.js";

const STREAM_RE = /stream\r?\n?([\s\S]*?)endstream/g;

/**
 * PDF operators we care about. Everything else (graphics, colour, clipping) is
 * skipped, which is why this is a lexer and not a full content-stream parser.
 */
const TOKEN_RE =
  /(-?\d*\.?\d+)|\/([#\w]+)|(\((?:\\[\s\S]|[^\\()])*\))|(\[(?:[^\][\\]|\\[\s\S]|\((?:\\[\s\S]|[^\\()])*\))*\])|(Tm|Td|TD|TL|Tf|T\*|Tj|TJ|BT|ET|'|")/g;

/** One text-showing operation, positioned in unscaled text space. */
export interface PositionedText {
  x: number;
  y: number;
  text: string;
}

export interface LayoutPage {
  /** Zero-based index among the content streams that carried text. */
  index: number;
  items: PositionedText[];
}

export interface LayoutOptions {
  /**
   * Lines within this many points of each other are the same line. Body copy in
   * the OAB cadernos runs ~11pt leading, so 2.5 merges sub/superscripts
   * ("46º") without merging adjacent lines.
   */
  lineTolerance?: number;
  /**
   * A page is treated as two-column only when each half holds at least this
   * many fragments. Cover pages and gabarito grids stay single-column.
   */
  minItemsPerColumn?: number;
}

const DEFAULTS = {
  lineTolerance: 2.5,
  minItemsPerColumn: 20,
} satisfies Required<LayoutOptions>;

type Matrix = [number, number, number, number, number, number];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** Text-space translation: the `Td`/`T*` operators, applied to the line matrix. */
function translate(m: Matrix, tx: number, ty: number): Matrix {
  return [m[0], m[1], m[2], m[3], m[0] * tx + m[2] * ty + m[4], m[1] * tx + m[3] * ty + m[5]];
}

function decodeLiteral(literal: string): string {
  return literal
    .slice(1, -1)
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\([\s\S])/g, "$1");
}

function inflate(payload: Buffer): string | null {
  try {
    return inflateSync(payload).toString("latin1");
  } catch {
    /* not zlib */
  }
  try {
    return unzipSync(payload).toString("latin1");
  } catch {
    /* not gzip */
  }
  const asText = payload.toString("latin1");
  return /\bTj\b|\bTJ\b/.test(asText) ? asText : null;
}

/**
 * Reads one content stream into positioned fragments.
 *
 * Exported for tests: a hand-written stream is far easier to reason about than
 * a real PDF, and it pins the operator semantics we depend on.
 */
export function readPositionedText(content: string, fonts: FontMap = new Map()): PositionedText[] {
  const items: PositionedText[] = [];
  let textMatrix: Matrix = [...IDENTITY];
  let lineMatrix: Matrix = [...IDENTITY];
  let leading = 0;
  let currentFont: string | null = null;
  let operands: Array<number | string> = [];

  const numbersAt = (count: number): number[] | null => {
    const tail = operands.slice(-count);
    if (tail.length !== count) return null;
    const values = tail.map(Number);
    return values.every(Number.isFinite) ? values : null;
  };

  const push = (literal: unknown) => {
    if (typeof literal !== "string") return;
    // decodeLiteral resolves escapes but keeps one character per raw byte, which
    // is exactly what the CMap indexes on.
    const cmap = currentFont ? fonts.get(currentFont) : undefined;
    const decode = (raw: string) => decodeWithCMap(decodeLiteral(raw), cmap);
    const text = literal.startsWith("[")
      ? [...literal.matchAll(/\((?:\\[\s\S]|[^\\()])*\)/g)].map((m) => decode(m[0])).join("")
      : literal.startsWith("(")
        ? decode(literal)
        : "";
    if (text) items.push({ x: textMatrix[4], y: textMatrix[5], text });
  };

  for (const match of content.matchAll(TOKEN_RE)) {
    if (match[1] !== undefined) {
      operands.push(Number(match[1]));
      continue;
    }
    if (match[2] !== undefined) {
      operands.push(`/${match[2]}`);
      continue;
    }
    if (match[3] !== undefined || match[4] !== undefined) {
      operands.push(match[3] ?? match[4]);
      continue;
    }

    switch (match[5]) {
      case "BT": {
        textMatrix = [...IDENTITY];
        lineMatrix = [...IDENTITY];
        break;
      }
      case "Tm": {
        const values = numbersAt(6);
        if (values) {
          lineMatrix = values as Matrix;
          textMatrix = [...lineMatrix];
        }
        break;
      }
      // `/R9 11 Tf` selects the font the next literals are encoded in, which is
      // what decides whether they need a /ToUnicode CMap to be readable.
      case "Tf": {
        const name = operands.find((operand) => typeof operand === "string" && operand.startsWith("/"));
        currentFont = typeof name === "string" ? name.slice(1) : currentFont;
        break;
      }
      case "TL": {
        const values = numbersAt(1);
        if (values) leading = values[0];
        break;
      }
      case "Td": {
        const values = numbersAt(2);
        if (values) {
          lineMatrix = translate(lineMatrix, values[0], values[1]);
          textMatrix = [...lineMatrix];
        }
        break;
      }
      case "TD": {
        const values = numbersAt(2);
        if (values) {
          leading = -values[1];
          lineMatrix = translate(lineMatrix, values[0], values[1]);
          textMatrix = [...lineMatrix];
        }
        break;
      }
      case "T*": {
        lineMatrix = translate(lineMatrix, 0, -leading);
        textMatrix = [...lineMatrix];
        break;
      }
      case "Tj":
      case "TJ": {
        push(operands.at(-1));
        break;
      }
      // `'` and `"` show text *after* moving to the next line.
      case "'":
      case '"': {
        lineMatrix = translate(lineMatrix, 0, -leading);
        textMatrix = [...lineMatrix];
        push(operands.at(-1));
        break;
      }
    }
    operands = [];
  }

  return items;
}

/** Splits a PDF into pages of positioned text. One content stream = one page. */
export function readLayoutPages(buffer: Buffer): LayoutPage[] {
  // latin1 keeps byte values intact so binary stream payloads survive the slice.
  const raw = buffer.toString("latin1");
  // Built once per document: the gabaritos come out of Ghostscript with subset
  // fonts whose character codes are glyph indices, so without their /ToUnicode
  // tables the answer key decodes to nothing at all.
  const fonts = buildFontMap(raw);
  const pages: LayoutPage[] = [];

  for (const match of raw.matchAll(STREAM_RE)) {
    const payload = match[1];
    if (!payload) continue;
    const decoded = inflate(Buffer.from(payload, "latin1"));
    if (!decoded || !/\bTj\b|\bTJ\b|'|"/.test(decoded)) continue;
    const items = readPositionedText(decoded, fonts);
    if (items.length > 0) pages.push({ index: pages.length, items });
  }

  return pages;
}

/**
 * Orders one page's fragments into text: columns left to right, lines top to
 * bottom within each column, fragments left to right within each line.
 *
 * Column detection is a single split at the horizontal midpoint rather than
 * clustering. The OAB cadernos are a fixed symmetric two-column layout, and a
 * midpoint split cannot mistake a wide table for two columns the way k-means on
 * x can.
 */
export function pageToText(page: LayoutPage, options: LayoutOptions = {}): string {
  const { lineTolerance, minItemsPerColumn } = { ...DEFAULTS, ...options };
  const items = page.items.filter((item) => item.text.trim() !== "" || item.text === " ");
  if (items.length === 0) return "";

  const xs = items.map((i) => i.x);
  const midpoint = (Math.min(...xs) + Math.max(...xs)) / 2;
  const left = items.filter((i) => i.x < midpoint);
  const right = items.filter((i) => i.x >= midpoint);
  const columns =
    left.length >= minItemsPerColumn && right.length >= minItemsPerColumn ? [left, right] : [items];

  return columns
    .map((column) => {
      const lines = new Map<number, PositionedText[]>();
      for (const item of column) {
        const key = Math.round(item.y / lineTolerance);
        const bucket = lines.get(key);
        if (bucket) bucket.push(item);
        else lines.set(key, [item]);
      }
      return [...lines.entries()]
        .sort((a, b) => b[0] - a[0]) // PDF y grows upward
        .map(([, bucket]) =>
          bucket
            .sort((a, b) => a.x - b.x)
            .map((i) => i.text)
            .join("")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter((line) => line !== "")
        .join("\n");
    })
    .filter((block) => block !== "")
    .join("\n");
}

/**
 * Whole document as reading-order text, pages separated by a form feed so
 * downstream parsers can strip per-page furniture (running heads, folios).
 */
export function extractLayoutText(buffer: Buffer, options: LayoutOptions = {}): string {
  return readLayoutPages(buffer)
    .map((page) => pageToText(page, options))
    .filter((text) => text !== "")
    .join("\n\f\n");
}
