-- Content pipeline v2 (§29.2): roles, syllabus, KU, validation ladder support.
-- Demotes legacy generation-origin published items (§44 step 3).

CREATE TYPE "DocumentRole" AS ENUM (
  'specification',
  'evidence',
  'knowledge',
  'administrative',
  'mixed',
  'unknown'
);

CREATE TYPE "SectionRole" AS ENUM (
  'syllabus',
  'vacancies',
  'schedule',
  'registration',
  'exam_structure',
  'legal_disposition',
  'instructional',
  'content',
  'legal_article',
  'question_block',
  'answer_key',
  'nav',
  'other'
);

CREATE TYPE "EligibilityStatus" AS ENUM ('eligible', 'ineligible', 'parked');

ALTER TYPE "QuestionItemOrigin" ADD VALUE 'transcription';

-- Document: role typing + dedup keys
ALTER TABLE "Document"
  ADD COLUMN "role" "DocumentRole" NOT NULL DEFAULT 'unknown',
  ADD COLUMN "roleConfidence" DOUBLE PRECISION,
  ADD COLUMN "roleMethod" TEXT,
  ADD COLUMN "subtype" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "textHash" TEXT,
  ADD COLUMN "simhash" BIGINT,
  ADD COLUMN "nearDuplicateOfId" TEXT,
  ADD COLUMN "rank" DOUBLE PRECISION,
  ADD COLUMN "language" TEXT,
  ADD COLUMN "normalizedKey" TEXT,
  ADD COLUMN "normalizerVersion" TEXT,
  ADD COLUMN "stats" JSONB;

CREATE UNIQUE INDEX "Document_contentHash_key" ON "Document"("contentHash");
CREATE INDEX "Document_role_idx" ON "Document"("role");

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_nearDuplicateOfId_fkey"
  FOREIGN KEY ("nearDuplicateOfId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Section
CREATE TABLE "Section" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "ordinal" INTEGER NOT NULL,
  "path" JSONB NOT NULL,
  "heading" TEXT,
  "level" INTEGER NOT NULL,
  "role" "SectionRole" NOT NULL DEFAULT 'other',
  "scores" JSONB NOT NULL,
  "charCount" INTEGER NOT NULL,
  "pageRange" JSONB,
  CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Section_documentId_ordinal_key" ON "Section"("documentId", "ordinal");
CREATE INDEX "Section_documentId_idx" ON "Section"("documentId");

ALTER TABLE "Section"
  ADD CONSTRAINT "Section_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Chunk: eligibility + content hash
ALTER TABLE "Chunk"
  ADD COLUMN "sectionId" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "eligibility" "EligibilityStatus" NOT NULL DEFAULT 'parked',
  ADD COLUMN "eligibilityReason" TEXT,
  ADD COLUMN "duplicateOfId" TEXT;

UPDATE "Chunk" SET "contentHash" = 'legacy:' || "id" WHERE "contentHash" IS NULL;
UPDATE "Chunk" SET "eligibilityReason" = 'legacy' WHERE "eligibilityReason" IS NULL;

ALTER TABLE "Chunk" ALTER COLUMN "contentHash" SET NOT NULL;

CREATE UNIQUE INDEX "Chunk_documentId_contentHash_key" ON "Chunk"("documentId", "contentHash");
CREATE INDEX "Chunk_eligibility_idx" ON "Chunk"("eligibility");

ALTER TABLE "Chunk"
  ADD CONSTRAINT "Chunk_sectionId_fkey"
  FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Chunk"
  ADD CONSTRAINT "Chunk_duplicateOfId_fkey"
  FOREIGN KEY ("duplicateOfId") REFERENCES "Chunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Syllabus tree
CREATE TABLE "Syllabus" (
  "id" TEXT NOT NULL,
  "examSlug" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "sourceDocumentId" TEXT NOT NULL,
  "sourceDocumentHash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Syllabus_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Syllabus_examSlug_version_key" ON "Syllabus"("examSlug", "version");
CREATE INDEX "Syllabus_examSlug_status_idx" ON "Syllabus"("examSlug", "status");

CREATE TABLE "Position" (
  "id" TEXT NOT NULL,
  "syllabusId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "implicit" BOOLEAN NOT NULL DEFAULT false,
  "vacancies" INTEGER,
  CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Position_syllabusId_slug_key" ON "Position"("syllabusId", "slug");

ALTER TABLE "Position"
  ADD CONSTRAINT "Position_syllabusId_fkey"
  FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SyllabusNode" (
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
  "scope" TEXT NOT NULL,
  "positionIds" JSONB NOT NULL,
  "questionCount" INTEGER,
  "weight" DOUBLE PRECISION,
  "status" TEXT NOT NULL DEFAULT 'active',
  "extraction" JSONB NOT NULL,
  "embedding" vector(768),
  CONSTRAINT "SyllabusNode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SyllabusNode_syllabusId_depth_idx" ON "SyllabusNode"("syllabusId", "depth");
CREATE INDEX "SyllabusNode_canonicalKey_idx" ON "SyllabusNode"("canonicalKey");

ALTER TABLE "SyllabusNode"
  ADD CONSTRAINT "SyllabusNode_syllabusId_fkey"
  FOREIGN KEY ("syllabusId") REFERENCES "Syllabus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChunkSyllabusMap" (
  "chunkId" TEXT NOT NULL,
  "syllabusNodeId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "method" TEXT NOT NULL,
  CONSTRAINT "ChunkSyllabusMap_pkey" PRIMARY KEY ("chunkId", "syllabusNodeId")
);

CREATE INDEX "ChunkSyllabusMap_syllabusNodeId_score_idx" ON "ChunkSyllabusMap"("syllabusNodeId", "score");
CREATE INDEX "ChunkSyllabusMap_canonicalKey_idx" ON "ChunkSyllabusMap"("canonicalKey");

ALTER TABLE "ChunkSyllabusMap"
  ADD CONSTRAINT "ChunkSyllabusMap_chunkId_fkey"
  FOREIGN KEY ("chunkId") REFERENCES "Chunk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "KnowledgeUnit" (
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

CREATE INDEX "KnowledgeUnit_syllabusNodeId_status_idx" ON "KnowledgeUnit"("syllabusNodeId", "status");
CREATE INDEX "KnowledgeUnit_canonicalKey_status_idx" ON "KnowledgeUnit"("canonicalKey", "status");

CREATE TABLE "PreviousQuestion" (
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

CREATE UNIQUE INDEX "PreviousQuestion_fingerprint_key" ON "PreviousQuestion"("fingerprint");
CREATE INDEX "PreviousQuestion_banca_canonicalKey_idx" ON "PreviousQuestion"("banca", "canonicalKey");
CREATE INDEX "PreviousQuestion_examFamily_year_idx" ON "PreviousQuestion"("examFamily", "year");

ALTER TABLE "PreviousQuestion"
  ADD CONSTRAINT "PreviousQuestion_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ExamStyleProfile" (
  "id" TEXT NOT NULL,
  "banca" TEXT NOT NULL,
  "canonicalSubjectId" TEXT NOT NULL,
  "positionFamily" TEXT,
  "sampleSize" INTEGER NOT NULL,
  "profile" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExamStyleProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExamStyleProfile_banca_canonicalSubjectId_positionFamily_key"
  ON "ExamStyleProfile"("banca", "canonicalSubjectId", "positionFamily");

-- GenerationRun extensions
ALTER TABLE "GenerationRun"
  ADD COLUMN "positionId" TEXT,
  ADD COLUMN "syllabusNodeId" TEXT,
  ADD COLUMN "briefKey" TEXT,
  ADD COLUMN "promptVersion" TEXT NOT NULL DEFAULT 'legacy-v0',
  ADD COLUMN "difficulty" DOUBLE PRECISION,
  ADD COLUMN "tokensIn" INTEGER,
  ADD COLUMN "tokensOut" INTEGER;

-- QuestionItem extensions
ALTER TABLE "QuestionItem"
  ADD COLUMN "positionId" TEXT,
  ADD COLUMN "syllabusNodeId" TEXT,
  ADD COLUMN "canonicalKey" TEXT,
  ADD COLUMN "passage" TEXT,
  ADD COLUMN "knowledgeUnitIds" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "distractorRationale" JSONB,
  ADD COLUMN "difficulty" DOUBLE PRECISION,
  ADD COLUMN "empiricalDifficulty" DOUBLE PRECISION,
  ADD COLUMN "previousQuestionId" TEXT,
  ADD COLUMN "stemEmbedding" vector(768);

CREATE INDEX "QuestionItem_syllabusNodeId_status_idx" ON "QuestionItem"("syllabusNodeId", "status");

-- Legacy demotion: pre-redesign generation items should not stay published (§44.3).
UPDATE "QuestionItem"
SET
  "status" = 'needs_review',
  "failReasons" = CASE
    WHEN "failReasons" = '[]'::jsonb OR "failReasons" IS NULL
    THEN '["legacy_pre_redesign"]'::jsonb
    ELSE "failReasons" || '["legacy_pre_redesign"]'::jsonb
  END
WHERE "status" = 'published' AND "origin" = 'generation';
