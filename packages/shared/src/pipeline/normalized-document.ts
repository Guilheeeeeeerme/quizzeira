/** NormalizedDocument v1 contract (§12 / §29). */

export interface NormalizedBlock {
  type: "paragraph" | "heading" | "list_item" | "table" | "other";
  text: string;
  level?: number;
}

export interface NormalizedSection {
  ordinal: number;
  path: string[];
  heading: string | null;
  level: number;
  text: string;
  blocks?: NormalizedBlock[];
}

export interface NormalizedDocumentV1 {
  version: "normalized-document/v1";
  contentType: string;
  language: string;
  title: string | null;
  text: string;
  sections: NormalizedSection[];
  tables: unknown[];
  stats: {
    charCount: number;
    pageCount?: number;
    ocrUsed?: boolean;
  };
  cleaningLog: Array<{ rule: string; removedChars: number }>;
  extractor: string;
  extractedAt: string;
}

export function emptyNormalizedDocument(
  partial: Partial<NormalizedDocumentV1> & Pick<NormalizedDocumentV1, "text" | "contentType">,
): NormalizedDocumentV1 {
  return {
    version: "normalized-document/v1",
    contentType: partial.contentType,
    language: partial.language ?? "pt",
    title: partial.title ?? null,
    text: partial.text,
    sections: partial.sections ?? [],
    tables: partial.tables ?? [],
    stats: partial.stats ?? { charCount: partial.text.length },
    cleaningLog: partial.cleaningLog ?? [],
    extractor: partial.extractor ?? "unknown",
    extractedAt: partial.extractedAt ?? new Date().toISOString(),
  };
}
