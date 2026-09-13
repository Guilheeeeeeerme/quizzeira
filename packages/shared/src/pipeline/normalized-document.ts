// Concept: NormalizedDocument — versioned JSON contract from doc-processor (§29.3).
//
// Every extraction path (PDF, HTML, DOCX, …) produces this shape so Node never
// parses raw bytes again except in the OAB module.

import { z } from "zod";

export const NORMALIZED_DOCUMENT_SCHEMA_VERSION = "1" as const;

const blockTypeSchema = z.enum([
  "heading",
  "paragraph",
  "list_item",
  "table",
  "caption",
  "footnote",
  "page_artifact",
]);

const blockSchema = z.object({
  type: blockTypeSchema,
  text: z.string(),
  level: z.number().int().optional(),
  page: z.number().int().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
  fontStats: z
    .object({
      size: z.number().optional(),
      bold: z.boolean().optional(),
    })
    .optional(),
});

const sectionFlagSchema = z.enum([
  "boilerplate",
  "garbage",
  "non_pt",
  "table_only",
  "legal_article",
]);

const sectionSchema = z.object({
  id: z.string(),
  ordinal: z.number().int(),
  path: z.array(z.string()),
  heading: z.string().nullable(),
  level: z.number().int(),
  text: z.string(),
  charCount: z.number().int(),
  blockRange: z.tuple([z.number(), z.number()]),
  pageRange: z.tuple([z.number(), z.number()]).optional(),
  flags: z.array(sectionFlagSchema).default([]),
});

const tableSchema = z.object({
  id: z.string(),
  page: z.number().int().optional(),
  rows: z.array(z.array(z.string())),
  markdown: z.string(),
});

const cleaningLogEntrySchema = z.object({
  step: z.string(),
  removed: z.number().int(),
  sample: z.string().optional(),
});

export const normalizedDocumentSchema = z.object({
  schemaVersion: z.literal(NORMALIZED_DOCUMENT_SCHEMA_VERSION),
  documentId: z.string(),
  contentHash: z.string(),
  source: z.object({
    url: z.string().nullable(),
    contentType: z.string(),
    byteSize: z.number().int(),
    fetchedAt: z.string(),
  }),
  extractor: z.object({
    engine: z.enum([
      "pymupdf",
      "docling",
      "trafilatura",
      "python-docx",
      "libreoffice+docling",
      "ebooklib",
      "plain",
    ]),
    version: z.string(),
    options: z.record(z.string(), z.unknown()),
  }),
  stats: z.object({
    pages: z.number().int().nullable(),
    chars: z.number().int(),
    textLayerRatio: z.number().nullable(),
    ocrConfidence: z.number().nullable(),
    language: z.string(),
    blocksByType: z.record(z.string(), z.number().int()),
    linkDensity: z.number(),
  }),
  metadata: z.object({
    title: z.string().nullable(),
    author: z.string().nullable(),
    date: z.string().nullable(),
    sitename: z.string().nullable(),
  }),
  blocks: z.array(blockSchema),
  sections: z.array(sectionSchema),
  tables: z.array(tableSchema),
  cleaningLog: z.array(cleaningLogEntrySchema),
});

export type NormalizedDocument = z.infer<typeof normalizedDocumentSchema>;
export type NormalizedBlock = z.infer<typeof blockSchema>;
export type NormalizedSection = z.infer<typeof sectionSchema>;
export type NormalizedTable = z.infer<typeof tableSchema>;
export type CleaningLogEntry = z.infer<typeof cleaningLogEntrySchema>;

export function parseNormalizedDocument(input: unknown): NormalizedDocument {
  return normalizedDocumentSchema.parse(input);
}
