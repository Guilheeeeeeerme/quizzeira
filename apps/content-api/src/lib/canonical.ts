import { prisma } from "../lib/prisma";
import { subjectSlug } from "@quizzeira/shared";
import { findParityGaps } from "./parity";

/**
 * Canonical bank backfill (§7 legacy migration): infer CanonicalTopic rows
 * from existing SyllabusNode.canonicalKey rows, then create topic maps and
 * applicability mappings. Idempotent and additive — legacy rows keep their
 * identifiers and are never deleted or rewritten.
 */
export interface BackfillResult {
  topicsCreated: number;
  topicMapsCreated: number;
  applicabilitiesCreated: number;
  questionsMapped: number;
}

export async function backfillCanonicalBank(): Promise<BackfillResult> {
  const result: BackfillResult = {
    topicsCreated: 0,
    topicMapsCreated: 0,
    applicabilitiesCreated: 0,
    questionsMapped: 0,
  };

  // 1. One CanonicalTopic per distinct syllabus canonicalKey (pathSlug).
  const nodes = await prisma.syllabusNode.findMany({
    select: { id: true, canonicalKey: true, title: true },
    where: { status: "active" },
  });
  const topicIdByKey = new Map<string, string>();
  for (const node of nodes) {
    const key = node.canonicalKey;
    if (!key || topicIdByKey.has(key)) continue;
    const created = await prisma.canonicalTopic
      .create({
        data: {
          key,
          subject: subjectLabel(key),
          subjectSlug: subjectSlug(subjectLabel(key)),
          title: node.title || key,
        },
      })
      .catch(() => null);
    const topic =
      created ?? (await prisma.canonicalTopic.findUnique({ where: { key } }));
    if (topic) {
      topicIdByKey.set(key, topic.id);
      if (created) result.topicsCreated += 1;
    }
  }

  // 2. SyllabusTopicMap: every active node maps to its key's topic.
  for (const node of nodes) {
    const topicId = topicIdByKey.get(node.canonicalKey);
    if (!topicId) continue;
    const created = await prisma.syllabusTopicMap
      .create({
        data: {
          syllabusNodeId: node.id,
          canonicalTopicId: topicId,
          method: "canonicalKey",
          confidence: 1,
        },
      })
      .catch(() => null);
    if (created) result.topicMapsCreated += 1;
  }

  // 3. Applicability rows for existing exam-scoped questions (§7 legacy
  // migration): original examSlug stays on QuestionItem; nothing destructive.
  const items = await prisma.questionItem.findMany({
    where: { syllabusNodeId: { not: null } },
    select: { id: true, syllabusNodeId: true, canonicalKey: true },
    take: 5000,
  });
  for (const item of items) {
    if (!item.syllabusNodeId) continue;
    const topicId = item.canonicalKey
      ? topicIdByKey.get(item.canonicalKey) ?? null
      : null;
    const created = await prisma.questionApplicability
      .create({
        data: {
          questionItemId: item.id,
          syllabusNodeId: item.syllabusNodeId,
          canonicalTopicId: topicId,
          mappingMethod: "inherit",
          matchConfidence: 1,
          state: "active",
          lastValidatedAt: new Date(),
        },
      })
      .catch(() => null);
    if (!created) continue;
    result.applicabilitiesCreated += 1;
    if (topicId) {
      const mapped = await prisma.questionItem
        .updateMany({
          where: { id: item.id, canonicalTopicId: null },
          data: { canonicalTopicId: topicId },
        })
        .catch(() => null);
      if (mapped && mapped.count > 0) result.questionsMapped += 1;
    }
  }

  return result;
}

export interface ParityCheckResult {
  examSlug: string;
  legacyCount: number;
  canonicalCount: number;
  missingFromCanonical: string[];
}

/**
 * Dual-read parity check (§7, Next item 3): compares the legacy sampling
 * path (`QuestionItem.examSlug` + `syllabusNodeId` directly) against the
 * canonical path (active `QuestionApplicability` through the exam's active
 * syllabus) for one exam. `/published/sample` already reads through both
 * (dual-read); this is what tells an operator whether it is safe to drop
 * the legacy path for that exam without losing coverage.
 */
export async function checkCanonicalDualReadParity(examSlug: string): Promise<ParityCheckResult> {
  const [legacy, canonical] = await Promise.all([
    prisma.questionItem.findMany({
      where: { examSlug, status: "published", syllabusNodeId: { not: null } },
      select: { id: true },
    }),
    prisma.questionItem.findMany({
      where: {
        status: "published",
        applicabilities: {
          some: {
            state: "active",
            OR: [{ validThrough: null }, { validThrough: { gt: new Date() } }],
            syllabusNode: { syllabus: { examSlug, status: "active" } },
          },
        },
      },
      select: { id: true },
    }),
  ]);
  const legacyIds = legacy.map((r) => r.id);
  const canonicalIds = canonical.map((r) => r.id);
  return {
    examSlug,
    legacyCount: legacyIds.length,
    canonicalCount: canonicalIds.length,
    missingFromCanonical: findParityGaps(legacyIds, canonicalIds),
  };
}

function subjectLabel(key: string): string {
  return key.split("/")[0]?.trim() || key;
}
