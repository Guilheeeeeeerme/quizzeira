-- Autonomous source scouting (§6.1): observe-only by default. Additive.
CREATE TABLE "SourceCandidate" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startUrls" JSONB NOT NULL,
    "url" TEXT,
    "notes" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'unknown',
    "signals" JSONB NOT NULL DEFAULT '{}',
    "decision" TEXT NOT NULL DEFAULT 'observe',
    "status" TEXT NOT NULL DEFAULT 'observed',
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceCandidate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SourceCandidate_status_score_idx" ON "SourceCandidate"("status", "score");
CREATE INDEX "SourceCandidate_domain_idx" ON "SourceCandidate"("domain");
