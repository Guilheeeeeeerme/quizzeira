import type { FastifyInstance } from "fastify";
import type { QualityVerdict } from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { recordStageMetric } from "../../lib/stage-metrics";

export async function registerInternalQualityRoutes(app: FastifyInstance): Promise<void> {
  /** Drafts awaiting an Eval verdict; content-quality drains this. */
  app.get("/internal/question-items/pending-review", async (request) => {
    const q = request.query as { limit?: string };
    const items = await prisma.questionItem.findMany({
      where: { status: "draft" },
      orderBy: { createdAt: "asc" },
      take: Math.min(50, Number(q.limit || 10)),
    });
    return {
      items: items.map((i) => ({
        id: i.id,
        examSlug: i.examSlug,
        subject: i.subject,
        type: i.type,
        prompt: i.prompt,
        options: i.options,
        correctIndex: i.correctIndex,
        referenceAnswer: i.referenceAnswer,
        explanation: i.explanation,
        locale: i.locale,
        origin: i.origin,
        documentId: i.documentId,
        syllabusNodeId: i.syllabusNodeId,
        knowledgeUnitIds: Array.isArray(i.knowledgeUnitIds) ? i.knowledgeUnitIds : [],
        passage: i.passage,
        distractorRationale: Array.isArray(i.distractorRationale) ? i.distractorRationale : [],
      })),
    };
  });

  /**
   * Demote published generation-origin items to needs_review with
   * failReasons=["legacy_pre_redesign"] (§40.4 / §48.7).
   */
  app.post("/internal/question-items/demote-legacy-generation", async () => {
    const updated = await prisma.questionItem.updateMany({
      where: { status: "published", origin: "generation" },
      data: {
        status: "needs_review",
        failReasons: ["legacy_pre_redesign"],
        publishedAt: null,
      },
    });
    return { demoted: updated.count };
  });

  /**
   * Publish gate. This is the single transition into `published` in the whole
   * platform; the study API reads nothing else.
   */
  app.post<{ Body: QualityVerdict & { stage?: string; model?: string } }>(
    "/internal/question-items/verdict",
    async (request) => {
      const body = request.body;
      if (!body?.itemId) {
        throw Object.assign(new Error("itemId is required"), { statusCode: 400 });
      }
      const decision = body.decision;
      if (decision !== "published" && decision !== "failed" && decision !== "needs_review") {
        throw Object.assign(new Error(`unknown decision: ${decision}`), { statusCode: 400 });
      }

      const [item] = await prisma.$transaction([
        prisma.questionItem.update({
          where: { id: body.itemId },
          data: {
            status: decision,
            qualityScore: Number.isFinite(body.score) ? body.score : null,
            qualityNotes: body.notes?.slice(0, 1000) ?? null,
            failReasons: body.reasons ?? [],
            reviewCount: { increment: 1 },
            publishedAt: decision === "published" ? new Date() : null,
          },
        }),
        prisma.qualityReview.create({
          data: {
            itemId: body.itemId,
            stage: body.stage || "eval",
            decision,
            score: Number.isFinite(body.score) ? body.score : 0,
            notes: body.notes?.slice(0, 1000) ?? null,
            reasons: body.reasons ?? [],
            model: body.model ?? null,
          },
        }),
      ]);

      const primaryReason = Array.isArray(body.reasons) ? String(body.reasons[0] ?? "") : "";
      await recordStageMetric(prisma, {
        stage: String(body.stage || "eval"),
        decision,
        reason: primaryReason,
      }).catch(() => undefined);

      return { item };
    },
  );

  /** Increment hourly StageMetric buckets (§31.1). */
  app.post<{ Body: Record<string, unknown> }>("/internal/stage-metrics", async (request) => {
    const body = request.body ?? {};
    await recordStageMetric(prisma, {
      stage: String(body.stage || ""),
      decision: String(body.decision || ""),
      reason: body.reason != null ? String(body.reason) : "",
      durationMs: body.durationMs != null ? Number(body.durationMs) : 0,
      tokensIn: body.tokensIn != null ? Number(body.tokensIn) : 0,
      tokensOut: body.tokensOut != null ? Number(body.tokensOut) : 0,
      count: body.count != null ? Number(body.count) : 1,
    });
    return { ok: true };
  });

  app.get("/internal/stage-metrics", async (request) => {
    const q = request.query as { hours?: string; stage?: string };
    const hours = Math.min(168, Math.max(1, Number(q.hours || 24)));
    const since = new Date(Date.now() - hours * 3600_000);
    const rows = await prisma.stageMetric.findMany({
      where: {
        hourBucket: { gte: since },
        ...(q.stage ? { stage: String(q.stage) } : {}),
      },
      orderBy: [{ hourBucket: "desc" }, { stage: "asc" }],
      take: 500,
    });
    return { items: rows };
  });

  app.get("/internal/metrics/pipeline", async (request) => {
    const q = request.query as { hours?: string };
    const { computePipelineMetrics } = await import("../../lib/metrics.js");
    return computePipelineMetrics(prisma, { hours: Number(q.hours || 24) });
  });
}
