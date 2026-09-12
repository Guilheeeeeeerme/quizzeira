// Concept: Product metrics from StageMetric + QuestionItem (§32).

export interface PipelineMetricSnapshot {
  syllabusMappedShare: number | null;
  adminRejectShare: number | null;
  publishedCount: number;
  reviewedWindowCount: number;
  failedMetadataCount: number;
  /** published / (published + failed + needs_review) in the window (§32). */
  publishRate: number | null;
  /** (tokensIn+tokensOut) / published in the window; null if no publishes (§32). */
  tokensPerPublished: number | null;
  stageBuckets: Array<{
    stage: string;
    decision: string;
    reason: string;
    count: number;
  }>;
  reasonHistogram: Array<{ reason: string; count: number }>;
}

function reasonsOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

type MetricsPrisma = {
  questionItem: {
    count: (args: unknown) => Promise<number>;
    findMany: (args: unknown) => Promise<Array<{ failReasons: unknown; status: string }>>;
  };
  stageMetric: {
    findMany: (args: unknown) => Promise<
      Array<{
        stage: string;
        decision: string;
        reason: string;
        count: number;
        tokensIn?: number;
        tokensOut?: number;
      }>
    >;
  };
};

/** Compute live snapshot metrics for admin / alerts. */
export async function computePipelineMetrics(
  prisma: MetricsPrisma,
  opts: { hours?: number } = {},
): Promise<PipelineMetricSnapshot> {
  const hours = Math.min(168, Math.max(1, opts.hours ?? 24));
  const since = new Date(Date.now() - hours * 3600_000);

  const [published, mapped, recent, buckets] = await Promise.all([
    prisma.questionItem.count({ where: { status: "published" } }),
    prisma.questionItem.count({
      where: { status: "published", syllabusNodeId: { not: null } },
    }),
    prisma.questionItem.findMany({
      where: {
        createdAt: { gte: since },
        status: { in: ["failed", "needs_review", "published"] },
      },
      select: { failReasons: true, status: true },
      take: 5000,
    }),
    prisma.stageMetric.findMany({
      where: { hourBucket: { gte: since } },
      orderBy: { hourBucket: "desc" },
      take: 500,
    }),
  ]);

  const failedMetadataCount = recent.filter((row) => {
    const reasons = reasonsOf(row.failReasons);
    return (
      reasons.includes("tests_exam_metadata") || reasons.includes("tests_syllabus_meta")
    );
  }).length;

  const reasonCounts = new Map<string, number>();
  for (const row of recent) {
    for (const reason of reasonsOf(row.failReasons)) {
      reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
    }
  }
  const reasonHistogram = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  const windowPublished = recent.filter((r) => r.status === "published").length;
  const windowDecided = recent.length;
  const publishRate = windowDecided === 0 ? null : windowPublished / windowDecided;

  let tokens = 0;
  for (const b of buckets) {
    tokens += Number(b.tokensIn ?? 0) + Number(b.tokensOut ?? 0);
  }
  const tokensPerPublished =
    windowPublished === 0 ? null : tokens / Math.max(1, windowPublished);

  return {
    syllabusMappedShare: published === 0 ? null : mapped / published,
    adminRejectShare:
      recent.length === 0 ? null : failedMetadataCount / Math.max(1, recent.length),
    publishedCount: published,
    reviewedWindowCount: recent.length,
    failedMetadataCount,
    publishRate,
    tokensPerPublished,
    stageBuckets: buckets.map((b) => ({
      stage: b.stage,
      decision: b.decision,
      reason: b.reason,
      count: b.count,
    })),
    reasonHistogram,
  };
}
