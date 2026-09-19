-- Durable job lease layer (§5): additive migration. Any async boundary in
-- content-api enqueues into this generic table instead of polling entity
-- tables; workers claim rows with FOR UPDATE SKIP LOCKED (see src/lib/jobs.ts).
-- No existing table or column is touched.

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
