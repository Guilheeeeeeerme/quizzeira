-- Concept: Ingestion schema (quizzeira_discovery)
CREATE TYPE "SourceStatus" AS ENUM ('active', 'broken', 'proposed', 'disabled');
CREATE TYPE "SourceTrust" AS ENUM ('high', 'medium', 'low');
CREATE TYPE "CrawlStrategy" AS ENUM ('listing_links', 'banca_portal', 'fixture');
CREATE TYPE "ArtifactKind" AS ENUM ('edital', 'prova', 'gabarito', 'programa', 'other');
CREATE TYPE "ExamStatus" AS ENUM ('open', 'closed', 'unknown');
CREATE TYPE "CrawlRunStatus" AS ENUM ('running', 'ok', 'partial', 'failed');

CREATE TABLE "Source" (
  "id" TEXT PRIMARY KEY,
  "domain" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startUrls" JSONB NOT NULL,
  "strategy" "CrawlStrategy" NOT NULL DEFAULT 'listing_links',
  "linkSelector" TEXT,
  "linkPatterns" JSONB NOT NULL,
  "openPatterns" JSONB NOT NULL,
  "trust" "SourceTrust" NOT NULL DEFAULT 'medium',
  "status" "SourceStatus" NOT NULL DEFAULT 'active',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "intervalSec" INTEGER NOT NULL DEFAULT 1800,
  "politenessMs" INTEGER NOT NULL DEFAULT 1000,
  "failCount" INTEGER NOT NULL DEFAULT 0,
  "lastOkAt" TIMESTAMP(3),
  "lastError" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "Source_status_idx" ON "Source"("status");
CREATE INDEX "Source_domain_idx" ON "Source"("domain");

CREATE TABLE "SourceProposal" (
  "id" TEXT PRIMARY KEY,
  "domain" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startUrls" JSONB NOT NULL,
  "reason" TEXT,
  "status" "SourceStatus" NOT NULL DEFAULT 'proposed',
  "sourceId" TEXT REFERENCES "Source"("id"),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3)
);
CREATE INDEX "SourceProposal_status_idx" ON "SourceProposal"("status");

CREATE TABLE "Exam" (
  "id" TEXT PRIMARY KEY,
  "examSlug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "org" TEXT,
  "banca" TEXT,
  "emphasis" JSONB NOT NULL,
  "editalUrl" TEXT,
  "listingUrl" TEXT NOT NULL,
  "status" "ExamStatus" NOT NULL DEFAULT 'open',
  "sourceId" TEXT NOT NULL REFERENCES "Source"("id"),
  "sourceDomain" TEXT NOT NULL,
  "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "Exam_examSlug_listingUrl_key" ON "Exam"("examSlug", "listingUrl");
CREATE INDEX "Exam_status_idx" ON "Exam"("status");
CREATE INDEX "Exam_examSlug_idx" ON "Exam"("examSlug");

CREATE TABLE "Artifact" (
  "id" TEXT PRIMARY KEY,
  "examId" TEXT REFERENCES "Exam"("id"),
  "sourceId" TEXT REFERENCES "Source"("id"),
  "kind" "ArtifactKind" NOT NULL,
  "url" TEXT,
  "storageKey" TEXT,
  "checksum" TEXT,
  "contentType" TEXT,
  "byteSize" INTEGER,
  "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published" BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX "Artifact_examId_idx" ON "Artifact"("examId");
CREATE INDEX "Artifact_kind_published_idx" ON "Artifact"("kind", "published");

CREATE TABLE "ListingFingerprint" (
  "id" TEXT PRIMARY KEY,
  "sourceId" TEXT NOT NULL REFERENCES "Source"("id") ON DELETE CASCADE,
  "startUrl" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "listingCount" INTEGER NOT NULL DEFAULT 0,
  "seenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "ListingFingerprint_sourceId_startUrl_key" ON "ListingFingerprint"("sourceId", "startUrl");
CREATE INDEX "ListingFingerprint_sourceId_seenAt_idx" ON "ListingFingerprint"("sourceId", "seenAt");

CREATE TABLE "ControlFlag" (
  "id" TEXT PRIMARY KEY,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "CrawlRun" (
  "id" TEXT PRIMARY KEY,
  "sourceId" TEXT REFERENCES "Source"("id"),
  "startedAt" TIMESTAMP(3) NOT NULL,
  "finishedAt" TIMESTAMP(3),
  "status" "CrawlRunStatus" NOT NULL DEFAULT 'running',
  "sourcesOk" INTEGER NOT NULL DEFAULT 0,
  "sourcesFailed" INTEGER NOT NULL DEFAULT 0,
  "openDiscovered" INTEGER NOT NULL DEFAULT 0,
  "proposedSources" INTEGER NOT NULL DEFAULT 0,
  "errors" JSONB NOT NULL
);
