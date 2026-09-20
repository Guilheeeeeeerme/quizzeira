-- Admin triage + retention: record the per-stage outcome of a process pass on
-- the Document (why an extracted file produced no syllabus / evidence / KUs)
-- and mark documents whose raw bytes were purged from object storage.

ALTER TABLE "Document" ADD COLUMN "outcome" JSONB;
ALTER TABLE "Document" ADD COLUMN "bytesPurgedAt" TIMESTAMP(3);

CREATE INDEX "Document_storageKey_idx" ON "Document"("storageKey");
