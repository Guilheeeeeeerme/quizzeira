// Concept: StageMetric hourly counters (§31.1).

export interface StageMetricEvent {
  stage: string;
  decision: string;
  reason?: string | null;
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
  count?: number;
}

function hourBucket(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
  );
}

type StageMetricClient = {
  stageMetric: {
    // Duck-typed to accept PrismaClient without fighting generated upsert types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upsert: (args: any) => Promise<unknown>;
  };
};

/** Upsert one hourly bucket increment. */
export async function recordStageMetric(
  prisma: StageMetricClient,
  event: StageMetricEvent,
): Promise<void> {
  const stage = String(event.stage || "").trim();
  const decision = String(event.decision || "").trim();
  if (!stage || !decision) return;

  const reason = String(event.reason ?? "").slice(0, 120);
  const count = Math.max(1, Number(event.count ?? 1));
  const tokensIn = Math.max(0, Number(event.tokensIn ?? 0));
  const tokensOut = Math.max(0, Number(event.tokensOut ?? 0));
  const durationMsSum = Math.max(0, Number(event.durationMs ?? 0));
  const bucket = hourBucket();

  await prisma.stageMetric.upsert({
    where: {
      hourBucket_stage_decision_reason: {
        hourBucket: bucket,
        stage,
        decision,
        reason,
      },
    },
    create: {
      hourBucket: bucket,
      stage,
      decision,
      reason,
      count,
      tokensIn,
      tokensOut,
      durationMsSum,
    },
    update: {
      count: { increment: count },
      tokensIn: { increment: tokensIn },
      tokensOut: { increment: tokensOut },
      durationMsSum: { increment: durationMsSum },
    },
  });
}
