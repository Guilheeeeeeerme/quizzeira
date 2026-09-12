-- StageMetric hourly buckets (§31.1 / §35)
CREATE TABLE "StageMetric" (
    "id" TEXT NOT NULL,
    "hourBucket" TIMESTAMP(3) NOT NULL,
    "stage" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "durationMsSum" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StageMetric_hourBucket_stage_decision_reason_key"
  ON "StageMetric"("hourBucket", "stage", "decision", "reason");

CREATE INDEX "StageMetric_hourBucket_stage_idx"
  ON "StageMetric"("hourBucket", "stage");
