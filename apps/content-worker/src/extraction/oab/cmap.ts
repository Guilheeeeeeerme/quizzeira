// Concept: Extraction (PDF character codes → Unicode)
//
// FGV publishes exam PDFs from at least two toolchains. Word writes WinAnsi
// text, where a byte is its own character and naive decoding works. PDFCreator
// + Ghostscript — which is what produces the gabaritos — writes subset fonts
// whose character codes are *glyph indices*: the answer key reads as
// "" and decodes to nothing at all.
//
// The bridge is the font's /ToUnicode CMap, which every such font carries. This
// module extracts those CMaps so the layout reader can decode through them.
import { inflateSync, unzipSync } from "node:zlib";

export interface ToUnicodeCMap {
  /** 1 for simple fonts, 2 for Identity-H / CID fonts. */
  codeByteLength: number;
  /** Character code → replacement text (usually one character). */
  map: Map<number, string>;
}

/** Font resource name as it appears in the content stream ("/R9", "/F2"). */
export type FontMap = Map<string, ToUnicodeCMap>;

const OBJECT_RE = /(\d+)\s+0\s+obj\b([\s\S]*?)\bendobj/g;
const STREAM_RE = /stream\r?\n?([\s\S]*?)endstream/;

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
  return payload.toString("latin1");
}

/** `<0041>` → "A"; multi-unit values become surrogate pairs / ligature strings. */
function hexToString(hex: string): string {
  const clean = hex.replace(/[^0-9a-f]/gi, "");
  let out = "";
  for (let i = 0; i + 3 < clean.length + 1; i += 4) {
    const unit = parseInt(clean.slice(i, i + 4), 16);
    if (Number.isFinite(unit)) out += String.fromCharCode(unit);
  }
  return out;
}

/**
 * Parses a /ToUnicode CMap: the `beginbfchar` (code → text) and `beginbfrange`
 * (code span → text span, or code span → explicit array) sections.
 */
export function parseToUnicodeCMap(cmap: string): ToUnicodeCMap {
  const map = new Map<number, string>();

  const codespace = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(cmap);
  const firstCode = codespace ? /<([0-9a-f]+)>/i.exec(codespace[1]) : null;
  const codeByteLength = firstCode && firstCode[1].length > 2 ? 2 : 1;

  for (const section of cmap.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const entry of section[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]*)>/gi)) {
      map.set(parseInt(entry[1], 16), hexToString(entry[2]));
    }
  }

  for (const section of cmap.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    // Array form: <lo> <hi> [ <a> <b> <c> ]
    for (const entry of section[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*\[([\s\S]*?)\]/gi)) {
      const lo = parseInt(entry[1], 16);
      const values = [...entry[3].matchAll(/<([0-9a-f]*)>/gi)];
      values.forEach((value, offset) => map.set(lo + offset, hexToString(value[1])));
    }
    // Span form: <lo> <hi> <base>
    for (const entry of section[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*<([0-9a-f]+)>/gi)) {
      const lo = parseInt(entry[1], 16);
      const hi = parseInt(entry[2], 16);
      const base = hexToString(entry[3]);
      if (!base || hi < lo || hi - lo > 0xffff) continue;
      const head = base.slice(0, -1);
      const tail = base.charCodeAt(base.length - 1);
      for (let code = lo; code <= hi; code += 1) {
        if (!map.has(code)) map.set(code, `${head}${String.fromCharCode(tail + (code - lo))}`);
      }
    }
  }

  return { codeByteLength, map };
}

/**
 * Builds font resource name → CMap for a whole document.
 *
 * The map is global rather than per page: resolving each content stream to its
 * own /Resources would mean walking the page tree, and FGV's producers give
 * fonts document-unique names. When a name *is* reused for two different fonts
 * the entry is dropped instead of guessed, so the reader falls back to raw
 * bytes rather than decoding through the wrong table.
 */
export function buildFontMap(raw: string): FontMap {
  const bodies = new Map<number, string>();
  for (const object of raw.matchAll(OBJECT_RE)) {
    bodies.set(Number(object[1]), object[2]);
  }

  // Font object → its parsed /ToUnicode CMap.
  const cmapByFontObject = new Map<number, ToUnicodeCMap>();
  for (const [number, body] of bodies) {
    const reference = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(body);
    if (!reference) continue;
    const cmapBody = bodies.get(Number(reference[1]));
    if (!cmapBody) continue;
    const stream = STREAM_RE.exec(cmapBody);
    if (!stream) continue;
    const decoded = inflate(Buffer.from(stream[1], "latin1"));
    if (!decoded || !/beginbfchar|beginbfrange/.test(decoded)) continue;
    cmapByFontObject.set(number, parseToUnicodeCMap(decoded));
  }

  if (cmapByFontObject.size === 0) return new Map();

  // Resource name → font object, across every dict that references a font.
  const candidates = new Map<string, Set<number>>();
  for (const body of bodies.values()) {
    for (const entry of body.matchAll(/\/([A-Za-z]\w*)\s+(\d+)\s+0\s+R/g)) {
      const target = Number(entry[2]);
      if (!cmapByFontObject.has(target)) continue;
      const set = candidates.get(entry[1]) ?? new Set<number>();
      set.add(target);
      candidates.set(entry[1], set);
    }
  }

  const fonts: FontMap = new Map();
  for (const [name, targets] of candidates) {
    if (targets.size !== 1) continue;
    const cmap = cmapByFontObject.get([...targets][0]);
    if (cmap) fonts.set(name, cmap);
  }
  return fonts;
}

/**
 * Decodes a PDF string literal through a CMap. `bytes` is a latin1 string, so
 * each character is one raw byte of the original literal.
 */
export function decodeWithCMap(bytes: string, cmap: ToUnicodeCMap | undefined): string {
  if (!cmap) return bytes;
  const step = cmap.codeByteLength;
  let out = "";
  for (let i = 0; i < bytes.length; i += step) {
    const code =
      step === 2
        ? (bytes.charCodeAt(i) << 8) | (bytes.charCodeAt(i + 1) || 0)
        : bytes.charCodeAt(i);
    const mapped = cmap.map.get(code);
    // An unmapped code in a subset font is a glyph we cannot name; emitting the
    // raw byte would inject control characters into question text.
    out += mapped ?? (step === 1 && code >= 0x20 ? bytes[i] : "");
  }
  return out;
}
