// Concept: Extraction (chunking)
//
// Chunks are the retrieval unit, so they need to be big enough to carry an
// argument and small enough to stay on-topic. We split on paragraph
// boundaries first and only fall back to hard slicing for runaway blocks.
export interface TextChunk {
  text: string;
  tokenCount: number;
}

export interface ChunkOptions {
  targetChars: number;
  overlapChars: number;
  maxChunks: number;
}

/** Rough token estimate; ~4 chars/token holds well enough for pt-BR prose. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function chunkText(text: string, options: ChunkOptions): TextChunk[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    // A single oversized paragraph (tables, dense legal text) gets hard-split
    // rather than blowing past the target by an order of magnitude.
    if (paragraph.length > options.targetChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      for (const slice of hardSplit(paragraph, options.targetChars)) {
        chunks.push(slice);
      }
      continue;
    }

    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    if (candidate.length > options.targetChars) {
      chunks.push(current);
      current = withOverlap(current, paragraph, options.overlapChars);
    } else {
      current = candidate;
    }
  }

  if (current.trim()) chunks.push(current);

  return chunks
    .map((t) => t.trim())
    .filter((t) => t.length >= 40)
    .slice(0, options.maxChunks)
    .map((t) => ({ text: t, tokenCount: estimateTokens(t) }));
}

/** Carries the tail of the previous chunk so a split sentence keeps context. */
function withOverlap(previous: string, next: string, overlapChars: number): string {
  if (overlapChars <= 0 || !previous) return next;
  const tail = previous.slice(-overlapChars);
  const boundary = tail.search(/[.!?]\s/);
  const carried = boundary >= 0 ? tail.slice(boundary + 2) : tail;
  return carried ? `${carried.trim()}\n\n${next}` : next;
}

function hardSplit(text: string, size: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    out.push(text.slice(i, i + size));
  }
  return out;
}
