// Concept: NormalizedDocument (§29.3) — the versioned JSON the doc-processor
// returns and every content stage reads. Zod is the boundary validator; the
// pydantic model in apps/doc-processor/app/schema.py is the mirror.
import { z } from "zod";

export const NORMALIZED_DOCUMENT_SCHEMA_VERSION = "1" as const;

export const BLOCK_TYPES = [
  "heading",
  "paragraph",
  "list_item",
  "table",
  "caption",
  "footnote",
  "page_artifact",
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export const SECTION_FLAGS = [
  "boilerplate",
  "garbage",
  "non_pt",
  "table_only",
  "legal_article",
] as const;
export type SectionFlag = (typeof SECTION_FLAGS)[number];

export const BlockSchema = z.object({
  type: z.enum(BLOCK_TYPES),
  text: z.string(),
  level: z.number().int().min(0).max(6).nullable().optional(),
  page: z.number().int().min(0).nullable().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).nullable().optional(),
  fontStats: z
    .object({ size: z.number().nullable().optional(), bold: z.boolean().nullable().optional() })
    .nullable()
    .optional(),
  /** Characters inside anchors, for link-density filters (HTML only). */
  linkChars: z.number().int().min(0).optional(),
  /** Set by cleaning steps; a flagged block is kept for the log but not sectioned. */
  flags: z.array(z.enum(["boilerplate", "garbage", "page_artifact", "glyph_noise"])).optional(),
});
export type Block = z.infer<typeof BlockSchema>;

export const SectionSchema = z.object({
  id: z.string(),
  ordinal: z.number().int().min(0),
  path: z.array(z.string()),
  heading: z.string().nullable(),
  level: z.number().int().min(0),
  text: z.string(),
  charCount: z.number().int().min(0),
  blockRange: z.tuple([z.number().int(), z.number().int()]),
  pageRange: z.tuple([z.number().int(), z.number().int()]).nullable().optional(),
  flags: z.array(z.enum(SECTION_FLAGS)),
});
export type Section = z.infer<typeof SectionSchema>;

export const TableSchema = z.object({
  page: z.number().int().nullable().optional(),
  blockIndex: z.number().int().nullable().optional(),
  rows: z.array(z.array(z.string())),
  markdown: z.string(),
});
export type Table = z.infer<typeof TableSchema>;

export const EXTRACTOR_ENGINES = [
  "pymupdf",
  "docling",
  "trafilatura",
  "python-docx",
  "python-pptx",
  "libreoffice+docling",
  "ebooklib",
  "plain",
  "node-html",
  "node-plain",
] as const;

export const NormalizedDocumentSchema = z.object({
  schemaVersion: z.literal(NORMALIZED_DOCUMENT_SCHEMA_VERSION),
  documentId: z.string(),
  contentHash: z.string(),
  source: z.object({
    url: z.string().nullable(),
    contentType: z.string(),
    byteSize: z.number().int().min(0),
    fetchedAt: z.string(),
  }),
  extractor: z.object({
    engine: z.enum(EXTRACTOR_ENGINES),
    version: z.string(),
    options: z.record(z.string(), z.unknown()),
  }),
  stats: z.object({
    pages: z.number().int().nullable(),
    chars: z.number().int().min(0),
    textLayerRatio: z.number().nullable(),
    ocrConfidence: z.number().nullable(),
    language: z.string(),
    blocksByType: z.record(z.string(), z.number().int()),
    linkDensity: z.number().min(0).max(1),
  }),
  metadata: z.object({
    title: z.string().nullable(),
    author: z.string().nullable(),
    date: z.string().nullable(),
    sitename: z.string().nullable(),
  }),
  blocks: z.array(BlockSchema),
  sections: z.array(SectionSchema),
  tables: z.array(TableSchema),
  cleaningLog: z.array(
    z.object({ step: z.string(), removed: z.number().int().min(0), sample: z.string().optional() }),
  ),
  /** Set by the processor when the document cannot be used at all. */
  failure: z
    .object({
      code: z.enum([
        "unsupported_format",
        "corrupt",
        "too_large",
        "ocr_low_confidence",
        "too_short",
      ]),
      detail: z.string(),
    })
    .nullable()
    .optional(),
});
export type NormalizedDocument = z.infer<typeof NormalizedDocumentSchema>;

export function parseNormalizedDocument(value: unknown): NormalizedDocument {
  return NormalizedDocumentSchema.parse(value);
}

export function safeParseNormalizedDocument(
  value: unknown,
): { ok: true; document: NormalizedDocument } | { ok: false; error: string } {
  const result = NormalizedDocumentSchema.safeParse(value);
  if (result.success) return { ok: true, document: result.data };
  const issue = result.error.issues[0];
  return {
    ok: false,
    error: issue ? `${issue.path.join(".") || "$"}: ${issue.message}` : "invalid document",
  };
}

/** JSON Schema is exported for the contract test against the Python model. */
export function normalizedDocumentJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(NormalizedDocumentSchema) as Record<string, unknown>;
}
