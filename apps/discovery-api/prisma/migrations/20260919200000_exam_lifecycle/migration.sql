-- Discovery exam lifecycle (registration OPEN/CLOSED stays on ExamStatus).
-- Soft-archive then hard-delete Discovery artifacts only; never Study/Content.

CREATE TYPE "ExamLifecyclePhase" AS ENUM (
  'announced',
  'registration_open',
  'registration_closed',
  'exam_scheduled',
  'exam_done',
  'past_due',
  'cancelled',
  'archived'
);

ALTER TABLE "Exam"
  ADD COLUMN "registrationStart" TIMESTAMP(3),
  ADD COLUMN "examDate" TIMESTAMP(3),
  ADD COLUMN "lifecyclePhase" "ExamLifecyclePhase" NOT NULL DEFAULT 'announced',
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "purgeEligibleAt" TIMESTAMP(3);

-- Backfill phase from existing registration status.
UPDATE "Exam" SET "lifecyclePhase" = 'registration_open' WHERE "status" = 'open';
UPDATE "Exam" SET "lifecyclePhase" = 'registration_closed' WHERE "status" = 'closed';
UPDATE "Exam" SET "lifecyclePhase" = 'announced' WHERE "status" = 'unknown';

CREATE INDEX "Exam_lifecyclePhase_idx" ON "Exam"("lifecyclePhase");
CREATE INDEX "Exam_examDate_idx" ON "Exam"("examDate");
