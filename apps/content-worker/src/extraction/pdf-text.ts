// Concept: Extraction (PDF → plain text)
//
// Editais are text-layer PDFs, so a dependency-free reader covers them: pull
// every content stream, inflate the FlateDecode ones, then read the text
// operators. Scanned/image-only PDFs yield nothing and are reported as such —
// OCR would be a separate stage, not a silent fallback.
import { inflateSync, unzipSync } from "node:zlib";

const STREAM_RE = /stream\r?\n?([\s\S]*?)endstream/g;

export interface PdfTextResult {
  text: string;
  streamCount: number;
  decodedStreams: number;
}

export function extractPdfText(buffer: Buffer): PdfTextResult {
  // Latin-1 keeps byte values intact, which matters because we slice binary
  // stream payloads back out of this string.
  const raw = buffer.toString("latin1");
  const parts: string[] = [];
  let streamCount = 0;
  let decodedStreams = 0;

  for (const match of raw.matchAll(STREAM_RE)) {
    streamCount += 1;
    const payload = match[1];
    if (!payload) continue;
    const decoded = decodeStream(Buffer.from(payload, "latin1"));
    if (!decoded) continue;
    const text = readTextOperators(decoded);
    if (text.trim()) {
      decodedStreams += 1;
      parts.push(text);
    }
  }

  return {
    text: normalizeWhitespace(parts.join("\n")),
    streamCount,
    decodedStreams,
  };
}

function decodeStream(payload: Buffer): string | null {
  // FlateDecode is overwhelmingly the common case; try raw text second.
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
 * Reads the PDF text-showing operators: `(literal) Tj` and `[(a) -20 (b)] TJ`.
 * Everything else in the content stream (positioning, graphics) is ignored.
 */
export function readTextOperators(content: string): string {
  const out: string[] = [];
  const showRe = /(\((?:\\.|[^\\()])*\)|\[(?:[^\][]|\\.)*\])\s*(Tj|TJ)/g;

  for (const match of content.matchAll(showRe)) {
    const operand = match[1];
    if (operand.startsWith("[")) {
      const pieces: string[] = [];
      for (const lit of operand.matchAll(/\((?:\\.|[^\\()])*\)/g)) {
        pieces.push(decodePdfLiteral(lit[0]));
      }
      out.push(pieces.join(""));
    } else {
      out.push(decodePdfLiteral(operand));
    }
  }

  // Line/paragraph operators are the only layout signal worth keeping.
  return out.join(content.includes("T*") || content.includes("Td") ? "\n" : " ");
}

function decodePdfLiteral(literal: string): string {
  const body = literal.slice(1, -1);
  return body
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\([0-7]{1,3})/g, (_, oct: string) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\(.)/g, "$1");
}

export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Strips tags from an HTML artifact so the same chunker can consume it. */
export function extractHtmlText(html: string): string {
  const withoutHead = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  return normalizeWhitespace(
    withoutHead
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code))),
  );
}
