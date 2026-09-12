-- Crawler redesign: discovery plane (§29.1)
CREATE TYPE "SourceKind" AS ENUM ('banca_portal', 'org_portal', 'aggregator', 'official_gazette', 'legislation', 'educational_site', 'open_textbook', 'standards_body', 'question_bank_public', 'exam_specific', 'fixture');
CREATE TYPE "DiscoveryMode" AS ENUM ('listing', 'topic_query', 'direct', 'custom');
CREATE TYPE "ExamKind" AS ENUM ('concurso', 'oab', 'certification', 'vestibular', 'other');
CREATE TYPE "ArtifactKindHint" AS ENUM ('edital', 'retificacao', 'programa', 'prova', 'gabarito', 'padrao_resposta', 'apostila', 'lei', 'artigo', 'manual', 'listing', 'unknown');
CREATE TYPE "RoleHint" AS ENUM ('specification', 'evidence', 'knowledge', 'administrative', 'unknown');

ALTER TABLE "Source"
  ADD COLUMN IF NOT EXISTS "kind" "SourceKind" NOT NULL DEFAULT 'aggregator',
  ADD COLUMN IF NOT EXISTS "discoveryMode" "DiscoveryMode" NOT NULL DEFAULT 'listing',
  ADD COLUMN IF NOT EXISTS "allowedRoles" JSONB,
  ADD COLUMN IF NOT EXISTS "authorityScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "licenseNote" TEXT,
  ADD COLUMN IF NOT EXISTS "robotsCache" JSONB;

ALTER TABLE "Exam"
  ADD COLUMN IF NOT EXISTS "kind" "ExamKind" NOT NULL DEFAULT 'concurso',
  ADD COLUMN IF NOT EXISTS "editionKey" TEXT,
  ADD COLUMN IF NOT EXISTS "detailUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "registrationEnd" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "statusSource" TEXT,
  ADD COLUMN IF NOT EXISTS "positions" JSONB;

CREATE INDEX IF NOT EXISTS "Exam_kind_idx" ON "Exam"("kind");

ALTER TABLE "Artifact"
  ADD COLUMN IF NOT EXISTS "kindHint" "ArtifactKindHint" NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "roleHint" "RoleHint" NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "anchorLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "topicQueryId" TEXT,
  ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
  ADD COLUMN IF NOT EXISTS "etag" TEXT,
  ADD COLUMN IF NOT EXISTS "lastModified" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fetchSignals" JSONB;

CREATE TABLE IF NOT EXISTS "TopicQuery" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "syllabusNodeId" TEXT NOT NULL,
  "canonicalKey" TEXT NOT NULL,
  "queries" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "candidatesFound" INTEGER NOT NULL DEFAULT 0,
  "candidatesStored" INTEGER NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "TopicQuery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TopicQuery_status_nextRunAt_idx" ON "TopicQuery"("status", "nextRunAt");
CREATE INDEX IF NOT EXISTS "TopicQuery_examId_syllabusNodeId_idx" ON "TopicQuery"("examId", "syllabusNodeId");

CREATE TABLE IF NOT EXISTS "DomainStats" (
  "domain" TEXT NOT NULL,
  "fetched" INTEGER NOT NULL DEFAULT 0,
  "becameKnowledge" INTEGER NOT NULL DEFAULT 0,
  "rejectedLowValue" INTEGER NOT NULL DEFAULT 0,
  "avgDensity" DOUBLE PRECISION,
  "authority" DOUBLE PRECISION,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DomainStats_pkey" PRIMARY KEY ("domain")
);

CREATE INDEX IF NOT EXISTS "Artifact_roleHint_idx" ON "Artifact"("roleHint");
CREATE INDEX IF NOT EXISTS "Artifact_topicQueryId_idx" ON "Artifact"("topicQueryId");

DO $$ BEGIN
  ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_topicQueryId_fkey"
    FOREIGN KEY ("topicQueryId") REFERENCES "TopicQuery"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
