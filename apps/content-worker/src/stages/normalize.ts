// Concept: Normalize — doc-processor or HTML fallback → NormalizedDocument (§13).

import {
  NORMALIZED_DOCUMENT_SCHEMA_VERSION,
  type NormalizedDocument,
  type NormalizedSection,
} from "@quizzeira/shared";
import { createHash } from "node:crypto";
import { processDocumentWithDocProcessor, ProcessorUnavailableError } from "../doc-processor-client.js";
import { extractHtmlText } from "./html-text.js";

export { ProcessorUnavailableError };

export interface NormalizeInput {
  documentId: string;
  contentType: string;
  bytes: Buffer;
  url?: string | null;
  roleHint?: string | null;
  kindHint?: string | null;
}

/** Strip HTML tags and collapse whitespace (fallback path). */
function stripHtml(html: string): string {
  return extractHtmlText(html);
}

function sectionFromBlocks(
  id: string,
  ordinal: number,
  heading: string | null,
  level: number,
  text: string,
): NormalizedSection {
  const flags: Array<"legal_article"> = [];
  if (/^Art(?:igo)?\.?\s*\d+/i.test(heading ?? "") || /^Art(?:igo)?\.?\s*\d+/im.test(text)) {
    flags.push("legal_article");
  }
  return {
    id,
    ordinal,
    path: heading ? [heading] : [],
    heading,
    level,
    text,
    charCount: text.length,
    blockRange: [0, 0],
    flags,
  };
}

/**
 * Minimal NormalizedDocument when doc-processor is unavailable (unit tests, dev
 * without Python). Splits on h1–h3 headings when present, else one section.
 */
export function normalizeHtmlFallback(input: NormalizeInput): NormalizedDocument {
  const raw = input.bytes.toString("utf8");
  const plain = stripHtml(raw);
  const contentHash = createHash("sha256").update(plain).digest("hex");

  const headingRe = /<(h[1-3])[^>]*>([\s\S]*?)<\/\1>/gi;
  const sections: NormalizedSection[] = [];
  let lastIndex = 0;
  let ordinal = 0;
  let match: RegExpExecArray | null;

  const pushSection = (heading: string | null, level: number, body: string) => {
    const text = body.trim();
    if (text.length < 20) return;
    sections.push(
      sectionFromBlocks(`sec-${ordinal}`, ordinal, heading, level, text),
    );
    ordinal += 1;
  };

  while ((match = headingRe.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      const prior = stripHtml(raw.slice(lastIndex, match.index));
      if (prior.trim() && sections.length === 0) {
        pushSection(null, 0, prior);
      }
    }
    const level = Number(match[1].slice(1));
    const heading = stripHtml(match[2]).trim();
    const next = headingRe.exec(raw);
    headingRe.lastIndex = match.index + match[0].length;
    const end = next ? next.index : raw.length;
    const body = stripHtml(raw.slice(match.index + match[0].length, end));
    pushSection(heading || null, level, body);
    lastIndex = end;
    if (next) headingRe.lastIndex = next.index;
  }

  if (sections.length === 0) {
    pushSection(null, 0, plain);
  } else if (lastIndex < raw.length) {
    const tail = stripHtml(raw.slice(lastIndex));
    if (tail.trim()) pushSection(null, 0, tail);
  }

  const linkMatches = raw.match(/href\s*=/gi) ?? [];
  const linkDensity = linkMatches.length / Math.max(plain.split(/\s+/).length / 10, 1);

  return {
    schemaVersion: NORMALIZED_DOCUMENT_SCHEMA_VERSION,
    documentId: input.documentId,
    contentHash,
    source: {
      url: input.url ?? null,
      contentType: input.contentType,
      byteSize: input.bytes.byteLength,
      fetchedAt: new Date().toISOString(),
    },
    extractor: {
      engine: "plain",
      version: "fallback-1",
      options: { fallback: true },
    },
    stats: {
      pages: null,
      chars: plain.length,
      textLayerRatio: null,
      ocrConfidence: null,
      language: "pt",
      blocksByType: { paragraph: sections.length },
      linkDensity: Math.min(1, linkDensity),
    },
    metadata: {
      title: extractTitle(raw),
      author: null,
      date: null,
      sitename: null,
    },
    blocks: sections.flatMap((s, i) => [
      {
        type: "heading" as const,
        text: s.heading ?? "",
        level: s.level,
      },
      {
        type: "paragraph" as const,
        text: s.text,
      },
    ]),
    sections,
    tables: [],
    cleaningLog: [{ step: "html_strip_fallback", removed: 0 }],
  };
}

function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? stripHtml(m[1]).trim() || null : null;
}

export async function normalizeDocument(input: NormalizeInput): Promise<NormalizedDocument> {
  try {
    return await processDocumentWithDocProcessor(input);
  } catch (err) {
    // Spec §33: processor unreachable → do not degrade; caller keeps doc pending.
    if (err instanceof ProcessorUnavailableError) throw err;
    if (/html/i.test(input.contentType) || input.bytes.subarray(0, 15).toString("utf8").includes("<")) {
      return normalizeHtmlFallback(input);
    }
    const text = input.bytes.toString("utf8").trim();
    return normalizeHtmlFallback({
      ...input,
      contentType: "text/html",
      bytes: Buffer.from(`<body><pre>${text}</pre></body>`, "utf8"),
    });
  }
}
