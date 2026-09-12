// Concept: Node HTML normaliser — the deterministic HTML → NormalizedDocument
// path used by tests, by the crawler's detail-page parser and as the worker's
// fallback when the Python doc-processor is not configured. PDFs never come
// through here.
import { sha256Hex } from "../sha256";
import { guessLanguage, uppercaseShare } from "../curriculum/text-stats";
import {
  NORMALIZED_DOCUMENT_SCHEMA_VERSION,
  type Block,
  type NormalizedDocument,
  type Table,
} from "./normalized-document";
import { buildSections, renderTableMarkdown } from "./sectioner";

// Sentinels marking anchor text so link density survives tag stripping.
const LINK_OPEN = "";
const LINK_CLOSE = "";

const BOILERPLATE_CONTAINER_RE =
  /<(nav|header|footer|aside|form|script|style|noscript|svg|iframe|button|select)\b[^>]*>[\s\S]*?<\/\1>/gi;
const BOILERPLATE_CLASS_RE =
  /<(div|section|ul|ol|span|p)\b[^>]*(?:class|id|role)=["'][^"']*(?:cookie|breadcrumb|share|related|sidebar|menu|navigation|banner|newsletter|social|popup|modal|advert|ads?\b)[^"']*["'][^>]*>[\s\S]*?<\/\1>/gi;

export function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
}

export function htmlTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return null;
  const title = decodeEntities(m[1].replace(/\s+/g, " ").trim());
  return title || null;
}

function stripTags(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " ")).replace(/[ \t\r\f\v]+/g, " ").trim();
}

function linkSpan(text: string): { text: string; linkChars: number } {
  let linkChars = 0;
  let inLink = false;
  let out = "";
  for (const ch of text) {
    if (ch === LINK_OPEN) {
      inLink = true;
      continue;
    }
    if (ch === LINK_CLOSE) {
      inLink = false;
      continue;
    }
    if (inLink && !/\s/.test(ch)) linkChars += 1;
    out += ch;
  }
  return { text: out.replace(/\s+/g, " ").trim(), linkChars };
}

function parseTable(tableHtml: string): Table | null {
  const rows: string[][] = [];
  for (const row of tableHtml.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map(
      (c) => linkSpan(stripTags(c[1])).text,
    );
    if (cells.some((c) => c)) rows.push(cells);
  }
  if (rows.length === 0) return null;
  return { rows, markdown: renderTableMarkdown(rows), page: null, blockIndex: null };
}

export interface HtmlNormalizeInput {
  html: string;
  documentId: string;
  url?: string | null;
  contentType?: string;
  byteSize?: number;
  fetchedAt?: string;
}

/** Tokenises an HTML body into typed blocks with per-block link chars. */
export function htmlToBlocks(html: string): { blocks: Block[]; tables: Table[]; removed: number } {
  const beforeLength = html.length;
  let body = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(BOILERPLATE_CONTAINER_RE, "")
    .replace(BOILERPLATE_CLASS_RE, "");
  const removed = beforeLength - body.length;
  const bodyMatch = /<body\b[^>]*>([\s\S]*?)<\/body>/i.exec(body);
  if (bodyMatch) body = bodyMatch[1];

  body = body.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, `${LINK_OPEN}$1${LINK_CLOSE}`);

  const blocks: Block[] = [];
  const tables: Table[] = [];
  const pieces: Array<{ tag: string; inner: string }> = [];
  const tableRanges: string[] = [];
  body = body.replace(/<table\b[^>]*>[\s\S]*?<\/table>/gi, (m) => {
    tableRanges.push(m);
    return `\n<table-placeholder data-index="${tableRanges.length - 1}"></table-placeholder>\n`;
  });
  const splitRe =
    /<\/?(h[1-6]|p|li|ul|ol|pre|blockquote|figcaption|dt|dd|div|section|article|main|header|footer|table-placeholder)\b[^>]*>|<br\s*\/?>|<hr\s*\/?>/gi;
  let lastTag = "p";
  let lastIndex = 0;
  for (const m of body.matchAll(splitRe)) {
    const index = m.index ?? 0;
    const chunk = body.slice(lastIndex, index);
    if (chunk.trim()) pieces.push({ tag: lastTag, inner: chunk });
    const raw = m[0];
    const tag = (m[1] ?? "br").toLowerCase();
    if (tag === "table-placeholder" && raw.startsWith("<table-placeholder")) {
      const idx = Number(/data-index="(\d+)"/.exec(raw)?.[1] ?? -1);
      const table = idx >= 0 ? parseTable(tableRanges[idx]) : null;
      if (table) {
        table.blockIndex = pieces.length;
        pieces.push({ tag: "table", inner: table.markdown });
        tables.push(table);
      }
      lastTag = "p";
    } else if (!raw.startsWith("</")) {
      lastTag = tag;
    } else {
      lastTag = "p";
    }
    lastIndex = index + raw.length;
  }
  const tail = body.slice(lastIndex);
  if (tail.trim()) pieces.push({ tag: lastTag, inner: tail });

  for (const piece of pieces) {
    if (piece.tag === "table") {
      blocks.push({ type: "table", text: piece.inner, linkChars: 0 });
      continue;
    }
    const { text, linkChars } = linkSpan(stripTags(piece.inner));
    if (!text) continue;
    const heading = /^h([1-6])$/.exec(piece.tag);
    if (heading) {
      blocks.push({ type: "heading", level: Number(heading[1]), text, linkChars });
    } else if (piece.tag === "li" || piece.tag === "dt" || piece.tag === "dd") {
      blocks.push({ type: "list_item", text, linkChars, level: 1 });
    } else if (piece.tag === "figcaption") {
      blocks.push({ type: "caption", text, linkChars });
    } else {
      blocks.push({ type: "paragraph", text, linkChars });
    }
  }
  return { blocks, tables, removed };
}

/** Link-density, repeated-block and page-number cleaning over blocks (§13.1). */
export function cleanBlocks(blocks: Block[]): {
  blocks: Block[];
  log: NormalizedDocument["cleaningLog"];
} {
  const log: NormalizedDocument["cleaningLog"] = [];
  let linkFiltered = 0;
  let repeated = 0;
  let pageArtifacts = 0;
  const seen = new Map<string, number>();
  for (const block of blocks) seen.set(block.text, (seen.get(block.text) ?? 0) + 1);
  const cleaned = blocks.map((block) => {
    const flags = [...(block.flags ?? [])];
    const chars = block.text.replace(/\s+/g, "").length;
    const links = block.linkChars ?? 0;
    if (chars > 0 && chars < 200 && links / chars > 0.5 && !flags.includes("boilerplate")) {
      flags.push("boilerplate");
      linkFiltered += 1;
    }
    if (
      (seen.get(block.text) ?? 0) >= 3 &&
      block.text.length < 120 &&
      !flags.includes("boilerplate")
    ) {
      flags.push("boilerplate");
      repeated += 1;
    }
    if (/^\s*(P[áa]gina\s+)?\d+(\s*\/\s*\d+)?\s*$/.test(block.text)) {
      flags.push("page_artifact");
      pageArtifacts += 1;
    }
    return flags.length ? { ...block, flags } : block;
  });
  log.push({ step: "link_density_filter", removed: linkFiltered });
  log.push({ step: "repeated_block_removal", removed: repeated });
  log.push({ step: "page_number_removal", removed: pageArtifacts });
  return { blocks: cleaned, log };
}

function finalize(
  input: { documentId: string; url?: string | null; contentType: string; byteSize: number; fetchedAt?: string },
  engine: "node-html" | "node-plain",
  contentHash: string,
  blocks: Block[],
  tables: Table[],
  log: NormalizedDocument["cleaningLog"],
  title: string | null,
): NormalizedDocument {
  const sections = buildSections(blocks, { documentId: input.documentId });
  const bodyText = sections.map((s) => s.text).join("\n\n");
  const totalChars = blocks.reduce((sum, b) => sum + b.text.replace(/\s+/g, "").length, 0);
  const totalLinks = blocks.reduce((sum, b) => sum + (b.linkChars ?? 0), 0);
  const blocksByType: Record<string, number> = {};
  for (const block of blocks) blocksByType[block.type] = (blocksByType[block.type] ?? 0) + 1;
  return {
    schemaVersion: NORMALIZED_DOCUMENT_SCHEMA_VERSION,
    documentId: input.documentId,
    contentHash,
    source: {
      url: input.url ?? null,
      contentType: input.contentType,
      byteSize: input.byteSize,
      fetchedAt: input.fetchedAt ?? new Date().toISOString(),
    },
    extractor: { engine, version: "1", options: {} },
    stats: {
      pages: null,
      chars: bodyText.length,
      textLayerRatio: null,
      ocrConfidence: null,
      language: guessLanguage(bodyText),
      blocksByType,
      linkDensity: totalChars > 0 ? Number(Math.min(1, totalLinks / totalChars).toFixed(4)) : 0,
    },
    metadata: { title, author: null, date: null, sitename: null },
    blocks,
    sections,
    tables,
    cleaningLog: log,
    failure: blocks.length === 0 ? { code: "too_short", detail: "no text blocks" } : null,
  };
}

export function normalizeHtml(input: HtmlNormalizeInput): NormalizedDocument {
  const { blocks: rawBlocks, tables, removed } = htmlToBlocks(input.html);
  const { blocks, log } = cleanBlocks(rawBlocks);
  return finalize(
    {
      documentId: input.documentId,
      url: input.url,
      contentType: input.contentType ?? "text/html",
      byteSize: input.byteSize ?? Buffer.byteLength(input.html, "utf8"),
      fetchedAt: input.fetchedAt,
    },
    "node-html",
    sha256Hex(input.html),
    blocks,
    tables,
    [{ step: "html_boilerplate_containers", removed }, ...log],
    htmlTitle(input.html),
  );
}

/** Plain text / markdown → NormalizedDocument (headings from `#` markers). */
export function normalizePlainText(input: {
  text: string;
  documentId: string;
  url?: string | null;
  contentType?: string;
}): NormalizedDocument {
  const blocks: Block[] = [];
  for (const paragraph of input.text.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const text = paragraph.trim();
    if (!text) continue;
    const md = /^(#{1,6})\s+(.+)$/.exec(text);
    if (md) blocks.push({ type: "heading", level: md[1].length, text: md[2].trim() });
    else if (/^\s*[-•*]\s+/.test(text) && !text.includes("\n")) {
      blocks.push({ type: "list_item", level: 1, text: text.replace(/^\s*[-•*]\s+/, "") });
    } else {
      // Single-line paragraphs are common in fixtures; keep line breaks inside
      // a block so outline items stay recognisable to the sectioner.
      const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
      const looksStructured =
        lines.length > 1 &&
        (lines.every((l) => l.length <= 120) ||
          lines.some((l) => /^\d{1,2}(?:\.\d{1,2})*[.)]?\s+\S/.test(l) || (l.length <= 80 && uppercaseShare(l) >= 0.8)));
      if (looksStructured) {
        for (const line of lines) blocks.push({ type: "paragraph", text: line });
      } else blocks.push({ type: "paragraph", text: text.replace(/\s*\n\s*/g, " ") });
    }
  }
  const { blocks: cleaned, log } = cleanBlocks(blocks);
  return finalize(
    {
      documentId: input.documentId,
      url: input.url,
      contentType: input.contentType ?? "text/plain",
      byteSize: Buffer.byteLength(input.text, "utf8"),
    },
    "node-plain",
    sha256Hex(input.text),
    cleaned,
    [],
    log,
    null,
  );
}
