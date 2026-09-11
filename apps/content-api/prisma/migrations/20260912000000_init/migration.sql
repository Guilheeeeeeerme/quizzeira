-- Concept: Question bank + Embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "QuestionItemStatus" AS ENUM ('draft', 'needs_recheck', 'published', 'failed');
CREATE TYPE "QuestionItemType" AS ENUM ('MULTIPLE_CHOICE', 'OPEN');
CREATE TYPE "SourceKind" AS ENUM ('extraction', 'generation', 'past_exam', 'crawl');

CREATE TABLE "Document" (
  "id" TEXT PRIMARY KEY,
  "artifactId" TEXT,
  "examSlug" TEXT,
  "kind" TEXT NOT NULL,
  "title" TEXT,
  "rawText" TEXT,
  "storageKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Document_examSlug_idx" ON "Document"("examSlug");
CREATE INDEX "Document_artifactId_idx" ON "Document"("artifactId");

CREATE TABLE "Chunk" (
  "id" TEXT PRIMARY KEY,
  "documentId" TEXT NOT NULL REFERENCES "Document"("id") ON DELETE CASCADE,
  "ordinal" INTEGER NOT NULL,
  "text" TEXT NOT NULL,
  "embedding" vector(1536),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Chunk_documentId_idx" ON "Chunk"("documentId");

CREATE TABLE "QuestionItem" (
  "id" TEXT PRIMARY KEY,
  "examSlug" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'pt',
  "type" "QuestionItemType" NOT NULL,
  "stem" TEXT NOT NULL,
  "options" JSONB,
  "correctIndex" INTEGER,
  "referenceAnswer" TEXT,
  "explanation" TEXT,
  "sourceKind" "SourceKind" NOT NULL DEFAULT 'generation',
  "status" "QuestionItemStatus" NOT NULL DEFAULT 'draft',
  "documentId" TEXT REFERENCES "Document"("id"),
  "failReasons" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "publishedAt" TIMESTAMP(3)
);
CREATE INDEX "QuestionItem_status_idx" ON "QuestionItem"("status");
CREATE INDEX "QuestionItem_examSlug_subject_idx" ON "QuestionItem"("examSlug", "subject");
CREATE INDEX "QuestionItem_examSlug_status_idx" ON "QuestionItem"("examSlug", "status");

CREATE TABLE "QualityCheck" (
  "id" TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL REFERENCES "QuestionItem"("id") ON DELETE CASCADE,
  "structuralOk" BOOLEAN NOT NULL,
  "judgeOk" BOOLEAN,
  "reasons" JSONB NOT NULL,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "QualityCheck_questionId_idx" ON "QualityCheck"("questionId");

CREATE TABLE "QualityFailure" (
  "id" TEXT PRIMARY KEY,
  "questionId" TEXT NOT NULL REFERENCES "QuestionItem"("id") ON DELETE CASCADE,
  "reasons" JSONB NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "QualityFailure_resolved_createdAt_idx" ON "QualityFailure"("resolved", "createdAt");
