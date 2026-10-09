-- Legislation / knowledge URL fingerprints for content-freshness worker.
-- Idempotent: table may already exist if applied via operator/MCP forward-migrate.
CREATE TABLE IF NOT EXISTS "FreshnessWatch" (
    "id" TEXT NOT NULL,
    "watchId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "topicTags" JSONB NOT NULL DEFAULT '[]',
    "fingerprint" TEXT,
    "etag" TEXT,
    "lastModified" TEXT,
    "contentLength" TEXT,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastChangedAt" TIMESTAMP(3),
    "changeCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FreshnessWatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FreshnessWatch_watchId_key" ON "FreshnessWatch"("watchId");
CREATE INDEX IF NOT EXISTS "FreshnessWatch_url_idx" ON "FreshnessWatch"("url");
CREATE INDEX IF NOT EXISTS "FreshnessWatch_lastCheckedAt_idx" ON "FreshnessWatch"("lastCheckedAt");
