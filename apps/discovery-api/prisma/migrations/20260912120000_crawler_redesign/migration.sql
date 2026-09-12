-- Crawler redesign §29.1: discovery modes, exam identity, artifact hints, topic queries.

CREATE TYPE "SourceKind" AS ENUM (
  'banca_portal',
  'org_portal',
  'aggregator',
  'official_gazette',
  'legislation',
  'educational_site',
  'open_textbook',
  'standards_body',
  'question_bank_public',
  'exam_specific',
  'fixture'
);

CREATE TYPE "DiscoveryMode" AS ENUM ('listing', 'topic_query', 'direct', 'custom');

CREATE TYPE "ExamKind" AS ENUM ('concurso', 'oab', 'certification', 'vestibular', 'other');

CREATE TYPE "ArtifactKindHint" AS ENUM (
  'edital',
  'retificacao',
  'programa',
  'prova',
  'gabarito',
  'padrao_resposta',
  'apostila',
  'lei',
  'artigo',
  'manual',
  'listing',
  'unknown'
);

CREATE TYPE "RoleHint" AS ENUM (
  'specification',
  'evidence',
  'knowledge',
  'administrative',
  'unknown'
);

ALTER TABLE "Source"
  ADD COLUMN "kind" "SourceKind" NOT NULL DEFAULT 'aggregator',
  ADD COLUMN "discoveryMode" "DiscoveryMode" NOT NULL DEFAULT 'listing',
  ADD COLUMN "allowedRoles" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "authorityScore" DOUBLE PRECISION,
  ADD COLUMN "licenseNote" TEXT,
  ADD COLUMN "robotsCache" JSONB;

ALTER TABLE "Exam"
  ADD COLUMN "kind" "ExamKind" NOT NULL DEFAULT 'concurso',
  ADD COLUMN "editionKey" TEXT,
  ADD COLUMN "detailUrl" TEXT,
  ADD COLUMN "registrationEnd" TIMESTAMP(3),
  ADD COLUMN "statusSource" TEXT,
  ADD COLUMN "positions" JSONB;

ALTER TABLE "Artifact"
  ADD COLUMN "kindHint" "ArtifactKindHint" NOT NULL DEFAULT 'unknown',
  ADD COLUMN "roleHint" "RoleHint" NOT NULL DEFAULT 'unknown',
  ADD COLUMN "anchorLabel" TEXT,
  ADD COLUMN "topicQueryId" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "etag" TEXT,
  ADD COLUMN "lastModified" TIMESTAMP(3),
  ADD COLUMN "fetchSignals" JSONB;

CREATE TABLE "TopicQuery" (
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

CREATE TABLE "DomainStats" (
  "domain" TEXT NOT NULL,
  "fetched" INTEGER NOT NULL DEFAULT 0,
  "becameKnowledge" INTEGER NOT NULL DEFAULT 0,
  "rejectedLowValue" INTEGER NOT NULL DEFAULT 0,
  "avgDensity" DOUBLE PRECISION,
  "authority" DOUBLE PRECISION,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DomainStats_pkey" PRIMARY KEY ("domain")
);

CREATE INDEX "TopicQuery_status_nextRunAt_idx" ON "TopicQuery"("status", "nextRunAt");
CREATE INDEX "TopicQuery_examId_syllabusNodeId_idx" ON "TopicQuery"("examId", "syllabusNodeId");

ALTER TABLE "Artifact"
  ADD CONSTRAINT "Artifact_topicQueryId_fkey"
  FOREIGN KEY ("topicQueryId") REFERENCES "TopicQuery"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Artifact_contentHash_idx" ON "Artifact"("contentHash");
