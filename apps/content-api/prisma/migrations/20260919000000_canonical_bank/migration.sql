-- Canonical question bank (§7): additive migration.
-- CanonicalTopic = durable subject/topic identity; SyllabusTopicMap links
-- exam syllabus nodes to it; QuestionApplicability maps questions to any
-- compatible syllabus node. No destructive change; legacy columns remain.

CREATE TABLE "CanonicalTopic" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "subjectSlug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanonicalTopic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CanonicalTopic_key_key" ON "CanonicalTopic"("key");
CREATE INDEX "CanonicalTopic_subjectSlug_status_idx" ON "CanonicalTopic"("subjectSlug", "status");

CREATE TABLE "SyllabusTopicMap" (
    "syllabusNodeId" TEXT NOT NULL,
    "canonicalTopicId" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'canonicalKey',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyllabusTopicMap_pkey" PRIMARY KEY ("syllabusNodeId","canonicalTopicId")
);

CREATE INDEX "SyllabusTopicMap_canonicalTopicId_idx" ON "SyllabusTopicMap"("canonicalTopicId");

ALTER TABLE "SyllabusTopicMap" ADD CONSTRAINT "SyllabusTopicMap_syllabusNodeId_fkey" FOREIGN KEY ("syllabusNodeId") REFERENCES "SyllabusNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SyllabusTopicMap" ADD CONSTRAINT "SyllabusTopicMap_canonicalTopicId_fkey" FOREIGN KEY ("canonicalTopicId") REFERENCES "CanonicalTopic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "QuestionApplicability" (
    "id" TEXT NOT NULL,
    "questionItemId" TEXT NOT NULL,
    "syllabusNodeId" TEXT NOT NULL,
    "canonicalTopicId" TEXT,
    "matchConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "mappingMethod" TEXT NOT NULL DEFAULT 'canonicalKey',
    "constraints" JSONB NOT NULL DEFAULT '{}',
    "state" TEXT NOT NULL DEFAULT 'active',
    "validThrough" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionApplicability_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionApplicability_questionItemId_syllabusNodeId_key" ON "QuestionApplicability"("questionItemId","syllabusNodeId");
CREATE INDEX "QuestionApplicability_syllabusNodeId_state_idx" ON "QuestionApplicability"("syllabusNodeId","state");
CREATE INDEX "QuestionApplicability_canonicalTopicId_idx" ON "QuestionApplicability"("canonicalTopicId");

ALTER TABLE "QuestionApplicability" ADD CONSTRAINT "QuestionApplicability_questionItemId_fkey" FOREIGN KEY ("questionItemId") REFERENCES "QuestionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionApplicability" ADD CONSTRAINT "QuestionApplicability_syllabusNodeId_fkey" FOREIGN KEY ("syllabusNodeId") REFERENCES "SyllabusNode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionApplicability" ADD CONSTRAINT "QuestionApplicability_canonicalTopicId_fkey" FOREIGN KEY ("canonicalTopicId") REFERENCES "CanonicalTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuestionItem" ADD COLUMN "canonicalTopicId" TEXT;
ALTER TABLE "QuestionItem" ADD CONSTRAINT "QuestionItem_canonicalTopicId_fkey" FOREIGN KEY ("canonicalTopicId") REFERENCES "CanonicalTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "QuestionItem_canonicalTopicId_idx" ON "QuestionItem"("canonicalTopicId");

ALTER TABLE "KnowledgeUnit" ADD COLUMN "canonicalTopicId" TEXT;
ALTER TABLE "KnowledgeUnit" ADD CONSTRAINT "KnowledgeUnit_canonicalTopicId_fkey" FOREIGN KEY ("canonicalTopicId") REFERENCES "CanonicalTopic"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "KnowledgeUnit_canonicalTopicId_idx" ON "KnowledgeUnit"("canonicalTopicId");
