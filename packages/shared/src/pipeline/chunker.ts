// Concept: Section-aware chunking (§22.1, §40.3). Chunks never cross a section
// boundary; sections that are too small are merged with siblings under the
// same parent, oversized ones are split on paragraph boundaries. No overlap:
// the section path carries the context the old overlap tried to preserve.
import { sha256Hex } from "../sha256";
import { normalizeForKey } from "../dedup/text-normalize";
import type { Section } from "./normalized-document";

export interface SectionChunk {
  ordinal: number;
  sectionOrdinal: number;
  sectionPath: string[];
  text: string;
  charCount: number;
  contentHash: string;
  tokenCount: number;
}

export interface ChunkerOptions {
  targetChars?: number;
  minChars?: number;
  maxChars?: number;
  maxChunks?: number;
}

const DEFAULTS = { targetChars: 1800, minChars: 300, maxChars: 4000, maxChunks: 400 };

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkContentHash(text: string): string {
  return sha256Hex(normalizeForKey(text, { digitsToZero: true }));
}

function splitLong(text: string, target: number, max: number): string[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (paragraph.length > max) {
      if (current) {
        out.push(current);
        current = "";
      }
      // Sentence-level split for a runaway paragraph (legal text, tables).
      let piece = "";
      for (const sentence of paragraph.split(/(?<=[.;!?])\s+/)) {
        if ((piece + " " + sentence).length > target && piece) {
          out.push(piece.trim());
          piece = sentence;
        } else piece = piece ? `${piece} ${sentence}` : sentence;
      }
      if (piece.trim()) out.push(piece.trim());
      continue;
    }
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > target && current) {
      out.push(current);
      current = paragraph;
    } else current = candidate;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

export function chunkSections(sections: readonly Section[], options: ChunkerOptions = {}): SectionChunk[] {
  const opts = { ...DEFAULTS, ...options };
  const out: SectionChunk[] = [];
  const usable = sections.filter((s) => s.text.trim() && !s.flags.includes("boilerplate") && !s.flags.includes("garbage"));

  // Merge small consecutive sections that share the same parent path.
  const merged: Array<{ ordinal: number; path: string[]; text: string }> = [];
  for (const section of usable) {
    const withHeading = section.heading && !section.text.startsWith(section.heading)
      ? `${section.heading}\n\n${section.text}`
      : section.text;
    const last = merged[merged.length - 1];
    const parent = section.path.slice(0, -1).join(" > ");
    const lastParent = last ? last.path.slice(0, -1).join(" > ") : null;
    if (
      last &&
      last.text.length < opts.minChars &&
      lastParent === parent &&
      last.text.length + withHeading.length <= opts.targetChars
    ) {
      last.text = `${last.text}\n\n${withHeading}`;
      continue;
    }
    merged.push({ ordinal: section.ordinal, path: [...section.path], text: withHeading });
  }

  for (const section of merged) {
    const pieces = section.text.length > opts.targetChars
      ? splitLong(section.text, opts.targetChars, opts.maxChars)
      : [section.text];
    for (const piece of pieces) {
      const text = piece.trim();
      if (!text) continue;
      out.push({
        ordinal: out.length,
        sectionOrdinal: section.ordinal,
        sectionPath: section.path,
        text,
        charCount: text.length,
        contentHash: chunkContentHash(text),
        tokenCount: estimateTokens(text),
      });
      if (out.length >= opts.maxChunks) return out;
    }
  }
  return out;
}
