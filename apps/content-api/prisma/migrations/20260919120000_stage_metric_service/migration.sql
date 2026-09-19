-- Tag StageMetric rows with the emitting SERVICE_NAME (§12 Next item 4: shadow
-- metrics report). Without this, content-worker's monolith and its
-- shadow-profile split (documents/embeddings/generation) write into the same
-- undifferentiated rows, making "compare per-stage StageMetric of split vs
-- monolith" impossible. Safe against existing data: every pre-existing row
-- gets service='' (content-api's own direct emitters already used '' as their
-- implicit service), so the old unique constraint's unaffected rows stay
-- unique under the new, wider one.

DROP INDEX "StageMetric_hourBucket_stage_decision_reason_key";

ALTER TABLE "StageMetric" ADD COLUMN     "service" TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX "StageMetric_hourBucket_stage_decision_reason_service_key" ON "StageMetric"("hourBucket", "stage", "decision", "reason", "service");
