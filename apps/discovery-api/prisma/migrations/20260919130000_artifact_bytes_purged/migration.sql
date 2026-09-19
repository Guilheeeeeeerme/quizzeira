-- Retention: Content's purge pass reports which artifact objects it deleted.
-- storageKey is kept for audit; bytesPurgedAt says the object is gone.

ALTER TABLE "Artifact" ADD COLUMN "bytesPurgedAt" TIMESTAMP(3);
