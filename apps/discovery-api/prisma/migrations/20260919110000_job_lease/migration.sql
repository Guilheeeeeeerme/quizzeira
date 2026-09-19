-- Durable job lease layer (§5), discovery-api's own copy of the content-api
-- table added in the same rollout (item 1a): additive migration, no existing
-- table or column touched. See apps/content-api's 20260919010000_job_lease
-- for the paired implementation; src/lib/jobs.ts documents the claim query.

CREATE TYPE "JobStatus" AS ENUM ('queued', 'leased', 'deferred', 'done', 'dead');

CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "lastErrorCode" TEXT,
    "lastError" TEXT,
    "correlationId" TEXT,
    "causationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Job_dedupeKey_key" ON "Job"("dedupeKey");
CREATE INDEX "Job_kind_status_availableAt_idx" ON "Job"("kind", "status", "availableAt");
CREATE INDEX "Job_status_leaseExpiresAt_idx" ON "Job"("status", "leaseExpiresAt");
