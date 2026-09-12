-- Pipeline v2 content plane (§29.2)
CREATE TYPE "DocumentRole" AS ENUM ('specification', 'evidence', 'knowledge', 'administrative', 'mixed', 'unknown');
CREATE TYPE "SectionRole" AS ENUM ('syllabus', 'vacancies', 'schedule', 'registration', 'exam_structure', 'legal_disposition', 'instructional', 'content', 'legal_article', 'question_block', 'answer_key', 'nav', 'other');
CREATE TYPE "EligibilityStatus" AS ENUM ('eligible', 'ineligible', 'parked');

ALTER TYPE "QuestionItemOrigin" ADD VALUE IF NOT EXISTS 'transcription';

ALTER TABLE "Document"
  ADD COLUMN IF NOT EXISTS "role" "DocumentRole" NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "roleConfidence" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "roleMethod" TEXT,
  ADD COLUMN IF NOT EXISTS "subtype" TEXT,
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "textHash" TEXT,
  ADD COLUMN IF NOT EXISTS "rank" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "language" TEXT,
  ADD COLUMN IF NOT EXISTS "normalizedKey" TEXT,
  ADD COLUMN IF NOT EXISTS "normalizerVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "stats" JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS "Document_contentHash_key" ON "Document"("contentHash");
CREATE INDEX IF NOT EXISTS "Document_role_idx" ON "Document"("role");

CREATE TABLE IF NOT EXISTS "Section" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "path" JSONB NOT NULL,
  "heading" TEXT,
  "level" INTEGER NOT NULL DEFAULT 0,
  "role" "SectionRole" NOT NULL DEFAULT 'other',
  "scores" JSONB,
  "charCount" INTEGER NOT NULL DEFAULT 0,
  "pageRange" JSONB,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Section_documentId_ordinal_key" ON "Section"("documentId", "ordinal");
CREATE INDEX IF NOT EXISTS "Section_documentId_idx" ON "Section"("documentId");

ALTER TABLE "Chunk"
  ADD COLUMN IF NOT EXISTS "sectionId" TEXT,
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "eligibility" "EligibilityStatus" NOT NULL DEFAULT 'parked',
  ADD COLUMN IF NOT EXISTS "eligibilityReason" TEXT,
  ADD COLUMN IF NOT EXISTS "duplicateOfId" TEXT;

CREATE INDEX IF NOT EXISTS "Chunk_eligibility_idx" ON "Chunk"("eligibility");

CREATE TABLE IF NOT EXISTS "Syllabus" (
  "id" TEXT NOT NULL,
  "examSlug" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "sourceDocumentHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Syllabus_examSlug_version_key" ON "Syllabus"("examSlug", "version");
CREATE INDEX IF NOT EXISTS "Syllabus_examSlug_status_idx" ON "Syllabus"("examSlug", "status");

CREATE TABLE IF NOT EXISTS "Position" (
  "id" TEXT NOT NULL,
  "syllabusId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "implicit" BOOLEAN NOT NULL DEFAULT false,
  "vacancies" INTEGER,
  CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Position_syllabusId_slug_key" ON "Position"("syllabusId", "slug");

CREATE TABLE IF NOT EXISTS "SyllabusNode" (
  "id" TEXT NOT NULL,
  "syllabusId" TEXT NOT NULL,
  "parentId" TEXT,
  "depth" INTEGER NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "rawText" TEXT NOT NULL,
  "pathSlug" TEXT NOT NULL,
  "canonicalSubjectId" TEXT,
  "canonicalKey" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'basic',
  "positionIds" JSONB NOT NULL,
  "questionCount" INTEGER,
  "weight" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'active',
  "extraction" JSONB,
  "embedding" vector(768),
  CONSTRAINT "SyllabusNode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "SyllabusNode_syllabusId_depth_idx" ON "SyllabusNode"("syllabusId", "depth");
CREATE INDEX IF NOT EXISTS "SyllabusNode_canonicalKey_idx" ON "SyllabusNode"("canonicalKey");

CREATE TABLE IF NOT EXISTS "ChunkSyllabusMap" (
  "chunkId" TEXT NOT NULL,
  "syllabusNodeId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL,
  CONSTRAINT "ChunkSyllabusMap_pkey" PRIMARY KEY ("chunkId", "syllabusNodeId")
);
CREATE INDEX IF NOT EXISTS "ChunkSyllabusMap_syllabusNodeId_score_idx" ON "ChunkSyllabusMap"("syllabusNodeId", "score");
CREATE INDEX IF NOT EXISTS "ChunkSyllabusMap_canonicalKey_idx" ON "ChunkSyllabusMap"("canonicalKey");

CREATE TABLE IF NOT EXISTS "KnowledgeUnit" (
  "id" TEXT NOT NULL,
  "syllabusNodeId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "statement" TEXT NOT NULL,
  "example" TEXT,
  "qualifiers" JSONB NOT NULL,
  "evidence" JSONB NOT NULL,
  "quality" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "mergedIntoId" TEXT,
  "extraction" JSONB NOT NULL,
  "embedding" vector(768),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeUnit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "KnowledgeUnit_syllabusNodeId_status_idx" ON "KnowledgeUnit"("syllabusNodeId", "status");
CREATE INDEX IF NOT EXISTS "KnowledgeUnit_canonicalKey_status_idx" ON "KnowledgeUnit"("canonicalKey", "status");

CREATE TABLE IF NOT EXISTS "PreviousQuestion" (
  "id" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "examFamily" TEXT NOT NULL,
  "banca" TEXT,
  "year" INTEGER,
  "position" TEXT,
  "phase" TEXT,
  "number" INTEGER NOT NULL,
  "bookletType" TEXT,
  "passage" TEXT,
  "prompt" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correctIndex" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'ok',
  "subjectHint" TEXT,
  "syllabusNodeId" TEXT,
  "canonicalKey" TEXT,
  "mapScore" DOUBLE PRECISION,
  "embedding" vector(768),
  CONSTRAINT "PreviousQuestion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "PreviousQuestion_fingerprint_key" ON "PreviousQuestion"("fingerprint");
CREATE INDEX IF NOT EXISTS "PreviousQuestion_banca_canonicalKey_idx" ON "PreviousQuestion"("banca", "canonicalKey");
CREATE INDEX IF NOT EXISTS "PreviousQuestion_examFamily_year_idx" ON "PreviousQuestion"("examFamily", "year");

CREATE TABLE IF NOT EXISTS "ExamStyleProfile" (
  "id" TEXT NOT NULL,
  "banca" TEXT NOT NULL,
  "canonicalSubjectId" TEXT NOT NULL,
  "positionFamily" TEXT NOT NULL DEFAULT '',
  "sampleSize" INTEGER NOT NULL,
  "profile" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamStyleProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ExamStyleProfile_banca_canonicalSubjectId_positionFamily_key"
  ON "ExamStyleProfile"("banca", "canonicalSubjectId", "positionFamily");

CREATE TABLE IF NOT EXISTS "StageMetric" (
  "id" TEXT NOT NULL,
  "stage" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" DOUBLE PRECISION NOT NULL,
  "labels" JSONB,
  "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StageMetric_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StageMetric_stage_name_at_idx" ON "StageMetric"("stage", "name", "at");

ALTER TABLE "QuestionItem"
  ADD COLUMN IF NOT EXISTS "positionId" TEXT,
  ADD COLUMN IF NOT EXISTS "syllabusNodeId" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalKey" TEXT,
  ADD COLUMN IF NOT EXISTS "passage" TEXT,
  ADD COLUMN IF NOT EXISTS "knowledgeUnitIds" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "distractorRationale" JSONB,
  ADD COLUMN IF NOT EXISTS "difficulty" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "empiricalDifficulty" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "previousQuestionId" TEXT;

CREATE INDEX IF NOT EXISTS "QuestionItem_syllabusNodeId_status_idx" ON "QuestionItem"("syllabusNodeId", "status");

ALTER TABLE "GenerationRun"
  ADD COLUMN IF NOT EXISTS "positionId" TEXT,
  ADD COLUMN IF NOT EXISTS "syllabusNodeId" TEXT,
  ADD COLUMN IF NOT EXISTS "briefKey" TEXT,
  ADD COLUMN IF NOT EXISTS "promptVersion" TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "tokensIn" INTEGER,
  ADD COLUMN IF NOT EXISTS "tokensOut" INTEGER;

CREATE INDEX IF NOT EXISTS "GenerationRun_syllabusNodeId_idx" ON "GenerationRun"("syllabusNodeId");

DO $$ BEGIN
  ALTER TABLE "Section" ADD CONSTRAINT "Section_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_sectionId_fkey"
    FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Position" ADD CONSTRAINT "Position_syllabusId_fkey"
    FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "SyllabusNode" ADD CONSTRAINT "SyllabusNode_syllabusId_fkey"
    FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "ChunkSyllabusMap" ADD CONSTRAINT "ChunkSyllabusMap_chunkId_fkey"
    FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
