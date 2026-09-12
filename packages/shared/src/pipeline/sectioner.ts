// Concept: Structural sectioning (§13.2) — headings, outline levels, section
// building and legal-article segmentation over an extractor's block list.
// Pure function; the Python processor and the Node HTML fallback both feed it.
import type { Block, Section, SectionFlag } from "./normalized-document";
import { alphaRatio, averageWordLength, uppercaseShare } from "../curriculum/text-stats";

const NUMERIC_OUTLINE_RE = /^(\d{1,2}(?:\.\d{1,2}){0,3})[.)]?\s+(\S.*)$/;
const ROMAN_OUTLINE_RE = /^([IVXLC]{1,6})\s*[.)\-–]\s+(\S.*)$/;
const LETTER_OUTLINE_RE = /^([A-Z])[.)]\s+(\S.*)$/;
const STRUCTURAL_HEADING_RE =
  /^(ANEXO|CAP[ÍI]TULO|T[ÍI]TULO|SE[ÇC][ÃA]O|LIVRO|PARTE|SUBSE[ÇC][ÃA]O)\b/i;
export const LEGAL_ARTICLE_RE = /^Art\.?\s*(\d+)[ºo°]?[\s.\-–]/i;
const MAX_HEADING_CHARS = 120;

export interface HeadingInfo {
  level: number;
  title: string;
  legalArticle: boolean;
}

/** Decides whether a block is a heading and at which outline level. */
export function detectHeading(block: Block, bodyFontSize: number | null): HeadingInfo | null {
  const text = block.text.replace(/\s+/g, " ").trim();
  if (!text) return null;

  if (LEGAL_ARTICLE_RE.test(text)) {
    return { level: 2, title: text.slice(0, MAX_HEADING_CHARS), legalArticle: true };
  }
  if (text.length > MAX_HEADING_CHARS) return null;
  if (block.type === "heading") {
    return { level: Math.max(1, Math.min(6, block.level ?? 1)), title: text, legalArticle: false };
  }
  if (STRUCTURAL_HEADING_RE.test(text) && !/[.]\s+\p{Ll}/u.test(text)) {
    return { level: 1, title: text, legalArticle: false };
  }
  const size = block.fontStats?.size ?? null;
  if (size != null && bodyFontSize != null && size >= bodyFontSize * 1.15 && !/[.!?]$/.test(text)) {
    return { level: size >= bodyFontSize * 1.4 ? 1 : 2, title: text, legalArticle: false };
  }
  const upper = uppercaseShare(text);
  const numeric = NUMERIC_OUTLINE_RE.exec(text);
  if (numeric && upper >= 0.6 && text.length <= 80) {
    const depth = numeric[1].split(".").length;
    return { level: Math.min(6, depth), title: text, legalArticle: false };
  }
  const roman = ROMAN_OUTLINE_RE.exec(text);
  if (roman && upper >= 0.6 && text.length <= 80) {
    return { level: 1, title: text, legalArticle: false };
  }
  const letter = LETTER_OUTLINE_RE.exec(text);
  if (letter && upper >= 0.8 && text.length <= 60) {
    return { level: 3, title: text, legalArticle: false };
  }
  // A short all-caps line on its own is a heading in most editais/apostilas.
  if (
    upper >= 0.85 &&
    text.length >= 4 &&
    text.length <= 80 &&
    !/[.;,]$/.test(text) &&
    block.type === "paragraph"
  ) {
    return { level: 2, title: text, legalArticle: false };
  }
  return null;
}

/** Body font = char-weighted median, so a few large headings cannot shift it. */
function medianFontSize(blocks: readonly Block[]): number | null {
  const sized = blocks
    .filter((b) => b.type === "paragraph" && b.fontStats?.size != null)
    .map((b) => ({ size: b.fontStats!.size as number, chars: Math.max(1, b.text.length) }))
    .sort((a, b) => a.size - b.size);
  if (sized.length === 0) return null;
  const total = sized.reduce((sum, b) => sum + b.chars, 0);
  let acc = 0;
  for (const block of sized) {
    acc += block.chars;
    if (acc * 2 >= total) return block.size;
  }
  return sized[sized.length - 1].size;
}

export function renderTableMarkdown(rows: readonly (readonly string[])[]): string {
  if (rows.length === 0) return "";
  const width = Math.max(...rows.map((r) => r.length));
  const pad = (r: readonly string[]) => [...r, ...new Array(width - r.length).fill("")];
  const header = pad(rows[0]);
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const row of rows.slice(1)) lines.push(`| ${pad(row).join(" | ")} |`);
  return lines.join("\n");
}

function isGarbageText(text: string): boolean {
  if (text.length < 40) return false;
  return alphaRatio(text) < 0.6 || averageWordLength(text) > 14;
}

export interface BuildSectionsOptions {
  documentId: string;
  /** Blocks whose `flags` include any of these are excluded from sections. */
  excludeFlags?: readonly string[];
}

interface OpenSection {
  heading: string | null;
  level: number;
  path: string[];
  texts: string[];
  start: number;
  end: number;
  pages: number[];
  legal: boolean;
  linkChars: number;
  chars: number;
  tableOnly: boolean;
}

/**
 * Builds sections: heading + following blocks until the next heading of the
 * same or higher level. Preamble before the first heading becomes section 0
 * with `heading: null`.
 */
export function buildSections(blocks: readonly Block[], options: BuildSectionsOptions): Section[] {
  const exclude = new Set(options.excludeFlags ?? ["boilerplate", "garbage", "page_artifact"]);
  const bodyFont = medianFontSize(blocks);
  const sections: Section[] = [];
  const stack: Array<{ level: number; title: string }> = [];
  let current: OpenSection | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.texts.join("\n\n").trim();
    if (!text && current.heading === null) {
      current = null;
      return;
    }
    const flags: SectionFlag[] = [];
    if (current.legal) flags.push("legal_article");
    if (current.tableOnly && text) flags.push("table_only");
    if (current.chars > 0 && current.linkChars / current.chars > 0.5) flags.push("boilerplate");
    if (isGarbageText(text)) flags.push("garbage");
    const ordinal = sections.length;
    sections.push({
      id: `${options.documentId}:${ordinal}`,
      ordinal,
      path: [...current.path],
      heading: current.heading,
      level: current.level,
      text,
      charCount: text.length,
      blockRange: [current.start, current.end],
      pageRange:
        current.pages.length > 0 ? [Math.min(...current.pages), Math.max(...current.pages)] : null,
      flags,
    });
    current = null;
  };

  blocks.forEach((block, index) => {
    if (block.flags?.some((f) => exclude.has(f))) return;
    const heading = block.type === "table" ? null : detectHeading(block, bodyFont);
    if (heading) {
      flush();
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) stack.pop();
      stack.push({ level: heading.level, title: heading.title });
      current = {
        heading: heading.title,
        level: heading.level,
        path: stack.map((s) => s.title),
        texts: [],
        start: index,
        end: index,
        pages: block.page != null ? [block.page] : [],
        legal: heading.legalArticle,
        linkChars: 0,
        chars: 0,
        tableOnly: true,
      };
      // Legal articles carry their own text on the heading line.
      if (heading.legalArticle) {
        current.texts.push(block.text.trim());
        current.chars += block.text.length;
        current.tableOnly = false;
      }
      return;
    }
    if (!current) {
      current = {
        heading: null,
        level: 0,
        path: [],
        texts: [],
        start: index,
        end: index,
        pages: [],
        legal: false,
        linkChars: 0,
        chars: 0,
        tableOnly: true,
      };
    }
    const text = block.text.trim();
    if (!text) return;
    current.texts.push(text);
    current.end = index;
    current.chars += text.length;
    current.linkChars += block.linkChars ?? 0;
    if (block.page != null) current.pages.push(block.page);
    if (block.type !== "table") current.tableOnly = false;
  });
  flush();
  return sections;
}

/** Sections are contiguous, so their texts concatenate to the cleaned body. */
export function sectionsText(sections: readonly Section[]): string {
  return sections.map((s) => s.text).join("\n\n");
}
