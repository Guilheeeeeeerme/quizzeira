import type { FastifyInstance } from "fastify";
import { AttemptStatus } from "@prisma/client";
import { authenticate } from "../plugins/auth";
import { prisma } from "../lib/prisma";

export async function progressRoutes(app: FastifyInstance) {
  app.get("/progress", { preHandler: authenticate }, async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: request.userId },
      include: { topic: true },
      orderBy: { startedAt: "desc" },
    });

    return {
      items: attempts.map((a) => ({
        attemptId: a.id,
        levelSlug: "topic" as const,
        levelLabel: a.topic?.title ?? "Topic",
        topicId: a.topicId,
        topicTitle: a.topic?.title ?? null,
        status: a.status,
        score: a.status === AttemptStatus.CORRECTED ? a.score : null,
        maxScore: a.maxScore,
        startedAt: a.startedAt.toISOString(),
        submittedAt: a.submittedAt?.toISOString() ?? null,
        correctedAt: a.correctedAt?.toISOString() ?? null,
      })),
    };
  });

  app.get("/progress/summary", { preHandler: authenticate }, async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: request.userId },
      include: { topic: true },
      orderBy: { startedAt: "desc" },
    });

    const byTopic = new Map<
      string,
      {
        topicId: string | null;
        topicTitle: string;
        attemptCount: number;
        bestScore: number | null;
        lastScore: number | null;
      }
    >();

    for (const a of attempts) {
      const key = a.topicId ?? `orphan:${a.id}`;
      const title = a.topic?.title ?? "Topic";
      const existing = byTopic.get(key);
      const corrected =
        a.status === AttemptStatus.CORRECTED && a.score !== null ? a.score : null;
      if (!existing) {
        byTopic.set(key, {
          topicId: a.topicId,
          topicTitle: title,
          attemptCount: 1,
          bestScore: corrected,
          lastScore: corrected,
        });
      } else {
        existing.attemptCount += 1;
        if (corrected !== null) {
          existing.bestScore =
            existing.bestScore === null ? corrected : Math.max(existing.bestScore, corrected);
          if (existing.lastScore === null) existing.lastScore = corrected;
        }
      }
    }

    return { summary: [...byTopic.values()] };
  });
}
