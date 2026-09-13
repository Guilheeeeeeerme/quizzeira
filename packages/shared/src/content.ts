// Concept: Question bank (contracts shared by content-api, content-worker,
// content-quality and the study API sampler).
import { sha256Hex } from "./sha256";
import { slugifyKey } from "./slug";
import type { GeneratedQuestionInput, LocaleCode, QuestionType } from "./types";

/**
 * QuestionItem lifecycle. Content never publishes on its own — only the
 * Eval stage (content-quality) may move `draft` forward.
 *
 *   draft ──structural+judge pass──▶ published
 *     │                      │
 *     │                      └──fail──▶ failed ──▶ (HITL queue)
 *     └──needs_review (judge unsure / borderline) ──▶ HITL queue
 */
export type QuestionItemStatus = "draft" | "needs_review" | "published" | "failed";

export type ExtractionStatus = "pending" | "extracting" | "extracted" | "failed";

export type GenerationRunStatus = "queued" | "running" | "ok" | "partial" | "failed";

export type QuestionItemOrigin = "extraction" | "generation" | "transcription";

export interface ChunkDto {
  id: string;
  documentId: string;
  ordinal: number;
  text: string;
  tokenCount: number;
}

export interface DocumentDto {
  id: string;
  examSlug: string;
  kind: "edital" | "prova" | "gabarito" | "programa" | "other";
  sourceUrl: string | null;
  storageKey: string | null;
  checksum: string | null;
  status: ExtractionStatus;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionItemDto {
  id: string;
  examSlug: string;
  subject: string;
  subjectSlug: string;
  emphasis: string | null;
  origin: QuestionItemOrigin;
  status: QuestionItemStatus;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  locale: LocaleCode;
  documentId: string | null;
  /** Syllabus leaf this item assesses (§29.2). */
  syllabusNodeId: string | null;
  /** Knowledge units cited for generation-origin items. */
  knowledgeUnitIds: string[];
  /** Populated by content-quality; null until the Eval stage has run. */
  qualityScore: number | null;
  qualityNotes: string | null;
  failReasons: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface DraftQuestionsRequestBase {
  examSlug: string;
  subject: string;
  emphasis?: string | null;
  locale: LocaleCode;
  documentId?: string | null;
  /** Shared style exemplar when every draft in the batch cites the same PQ (§30). */
  previousQuestionId?: string | null;
  questions: GeneratedQuestionInput[];
}

/** Extraction / transcription drafts — syllabus link optional. */
export interface DraftQuestionsExtractionRequest extends DraftQuestionsRequestBase {
  origin: "extraction" | "transcription";
  syllabusNodeId?: string | null;
  knowledgeUnitIds?: string[];
}

/** Generation drafts — syllabus leaf + KU citations are mandatory (§24, §25.1). */
export interface DraftQuestionsGenerationRequest extends DraftQuestionsRequestBase {
  origin: "generation";
  syllabusNodeId: string;
  knowledgeUnitIds: string[];
}

/** Payload content-worker posts after extraction or generation. */
export type DraftQuestionsRequest =
  | DraftQuestionsExtractionRequest
  | DraftQuestionsGenerationRequest;

export interface DraftQuestionsResponse {
  created: number;
  skipped: number;
  ids: string[];
}

/** Eval verdict written back by content-quality. */
export interface QualityVerdict {
  itemId: string;
  decision: "published" | "failed" | "needs_review";
  score: number;
  notes: string;
  reasons: string[];
}

export interface PublishedSampleRequest {
  examSlug: string;
  subjects: string[];
  locale: LocaleCode;
  limit: number;
  excludeIds?: string[];
}

export interface PublishedSampleResponse {
  questions: GeneratedQuestionInput[];
  ids: string[];
  hitCount: number;
}

export interface ContentStatsDto {
  examSlug: string;
  draft: number;
  needsReview: number;
  published: number;
  failed: number;
  bySubject: Record<string, number>;
}

/** Same slug rules as the rest of the platform, but "geral" when unlabelled. */
export function subjectSlug(value: string): string {
  const slug = slugifyKey(value);
  return slug === "unknown" ? "geral" : slug;
}

/** Stable identity so re-extraction/re-generation dedupes instead of duplicating. */
export function questionItemFingerprint(input: {
  examSlug: string;
  subjectSlug: string;
  prompt: string;
  options?: string[] | null;
}): string {
  const normalizedPrompt = input.prompt.replace(/\s+/g, " ").trim().toLowerCase();
  const normalizedOptions = (input.options ?? [])
    .map((o) => o.replace(/\s+/g, " ").trim().toLowerCase())
    .join("|");
  return sha256Hex(
    `${input.examSlug}|${input.subjectSlug}|${normalizedPrompt}|${normalizedOptions}`,
  ).slice(0, 32);
}
