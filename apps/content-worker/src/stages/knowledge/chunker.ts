// Concept: Section-aware chunking — never cross section boundaries (§21–§22).

import { createHash } from "node:crypto";
import type { SectionRole } from "@quizzeira/shared";
import type { ClassifiedSection } from "../classify.js";

export interface KnowledgeChunkDraft {
  sectionId: string;
  sectionRole: SectionRole;
  ordinal: number;
  text: string;
  tokenCount: number;
  contentHash: string;
}

export interface ChunkerOptions {
  maxChars: number;
  minChars: number;
}

const DEFAULT_OPTS: ChunkerOptions = { maxChars: 3000, minChars: 300 };

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

function packParagraphs(paragraphs: string[], maxChars: number): string[] {
  const chunks: string[] = [];
  let current = "";
  for (const p of paragraphs) {
    const candidate = current ? `${current}\n\n${p}` : p;
    if (candidate.length > maxChars) {
      if (current) chunks.push(current);
      if (p.length > maxChars) {
        for (let i = 0; i < p.length; i += maxChars) {
          chunks.push(p.slice(i, i + maxChars));
        }
        current = "";
      } else {
        current = p;
      }
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current);
  return chunks;
}

/**
 * Chunks each classified section independently. Chunks never span sections.
 */
export function chunkSections(
  sections: ClassifiedSection[],
  options: Partial<ChunkerOptions> = {},
): KnowledgeChunkDraft[] {
  const opts = { ...DEFAULT_OPTS, ...options };
  const out: KnowledgeChunkDraft[] = [];
  let globalOrdinal = 0;

  for (const { section, role } of sections) {
    const paragraphs = section.text
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
    const packed = packParagraphs(paragraphs, opts.maxChars);

    for (const text of packed) {
      if (text.length < opts.minChars) continue;
      out.push({
        sectionId: section.id,
        sectionRole: role,
        ordinal: globalOrdinal++,
        text,
        tokenCount: estimateTokens(text),
        contentHash: createHash("sha256").update(text).digest("hex"),
      });
    }
  }

  return out;
}
