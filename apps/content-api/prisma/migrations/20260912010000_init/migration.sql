-- Concept: Question bank + Embeddings schema (quizzeira_content)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "ExtractionStatus" AS ENUM ('pending', 'extracting', 'extracted', 'failed');
CREATE TYPE "DocumentKind" AS ENUM ('edital', 'prova', 'gabarito', 'programa', 'other');
CREATE TYPE "QuestionItemStatus" AS ENUM ('draft', 'needs_review', 'published', 'failed');
CREATE TYPE "QuestionItemOrigin" AS ENUM ('extraction', 'generation');
CREATE TYPE "QuestionItemType" AS ENUM ('MULTIPLE_CHOICE', 'OPEN');
CREATE TYPE "GenerationRunStatus" AS ENUM ('queued', 'running', 'ok', 'partial', 'failed');

CREATE TABLE "Document" (
  "id" TEXT PRIMARY KEY,
  "discoveryArtifactId" TEXT UNIQUE,
  "examSlug" TEXT NOT NULL,
  "examTitle" TEXT,
  "kind" "DocumentKind" NOT NULL DEFAULT 'other',
  "sourceUrl" TEXT,
  "storageKey" TEXT,
  "checksum" TEXT,
  "contentType" TEXT,
  "status" "ExtractionStatus" NOT NULL DEFAULT 'pending',
  "failReason" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Document_status_idx" ON "Document"("status");
CREATE INDEX "Document_examSlug_idx" ON "Document"("examSlug");

CREATE TABLE "Chunk" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "ordinal" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "tokenCount" INTEGER NOT NULL DEFAULT 0,
  "embedding" vector(768),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Chunk_documentId_ordinal_key" ON "Chunk"("documentId", "ordinal");
CREATE INDEX "Chunk_documentId_idx" ON "Chunk"("documentId");
-- IVFFlat needs rows before it helps; harmless (and fast) to create up front.
CREATE INDEX "Chunk_embedding_cosine_idx" ON "Chunk"
  USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);

CREATE TABLE "GenerationRun" (
  "id" TEXT PRIMARY KEY,
  "examSlug" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "status" "GenerationRunStatus" NOT NULL DEFAULT 'queued',
  "requested" INTEGER NOT NULL DEFAULT 0,
  "drafted" INTEGER NOT NULL DEFAULT 0,
  "chunksUsed" INTEGER NOT NULL DEFAULT 0,
  "model" TEXT,
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3)
);
CREATE INDEX "GenerationRun_status_startedAt_idx" ON "GenerationRun"("status", "startedAt");
CREATE INDEX "GenerationRun_examSlug_idx" ON "GenerationRun"("examSlug");

CREATE TABLE "QuestionItem" (
  "id" TEXT PRIMARY KEY,
  "fingerprint" TEXT NOT NULL UNIQUE,
  "examSlug" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "subjectSlug" TEXT NOT NULL,
  "emphasis" TEXT,
  "origin" "QuestionItemOrigin" NOT NULL,
  "status" "QuestionItemStatus" NOT NULL DEFAULT 'draft',
  "type" "QuestionItemType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "options" JSONB,
  "correctIndex" INTEGER,
  "referenceAnswer" TEXT,
  "explanation" TEXT,
  "locale" TEXT NOT NULL DEFAULT 'pt',
  "documentId" TEXT REFERENCES "Document"("id"),
  "generationRunId" TEXT REFERENCES "GenerationRun"("id"),
  "qualityScore" DOUBLE PRECISION,
  "qualityNotes" TEXT,
  "failReasons" JSONB NOT NULL DEFAULT '[]',
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3)
);
CREATE INDEX "QuestionItem_status_examSlug_idx" ON "QuestionItem"("status", "examSlug");
CREATE INDEX "QuestionItem_examSlug_subjectSlug_status_idx" ON "QuestionItem"("examSlug", "subjectSlug", "status");
CREATE INDEX "QuestionItem_status_createdAt_idx" ON "QuestionItem"("status", "createdAt");

CREATE TABLE "QualityReview" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL REFERENCES "QuestionItem"("id") ON DELETE CASCADE,
  "stage" TEXT NOT NULL,
  "decision" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "reasons" JSONB NOT NULL DEFAULT '[]',
  "model" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "QualityReview_itemId_createdAt_idx" ON "QualityReview"("itemId", "createdAt");
CREATE INDEX "QualityReview_decision_createdAt_idx" ON "QualityReview"("decision", "createdAt");
