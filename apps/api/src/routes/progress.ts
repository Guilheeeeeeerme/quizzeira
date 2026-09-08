import type { FastifyInstance } from "fastify";
import { AttemptStatus } from "@prisma/client";
import { authenticate } from "../plugins/auth";
import { prisma } from "../lib/prisma";
import type { LevelSlug } from "@quizzeira/shared";

export async function progressRoutes(app: FastifyInstance) {
  app.get("/progress", { preHandler: authenticate }, async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });

    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: request.userId },
      include: { level: true, topic: true },
      orderBy: { startedAt: "desc" },
    });

    return {
      items: attempts.map((a) => ({
        attemptId: a.id,
        levelSlug: (a.level?.slug as LevelSlug | undefined) ?? "topic",
        levelLabel: a.level?.label ?? a.topic?.title ?? "Topic",
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

    const levels = await prisma.difficultyLevel.findMany({ orderBy: { sortOrder: "asc" } });
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: request.userId },
      orderBy: { startedAt: "desc" },
    });

    const summary = levels.map((level) => {
      const levelAttempts = attempts.filter((a) => a.levelId === level.id);
      const corrected = levelAttempts.filter(
        (a) => a.status === AttemptStatus.CORRECTED && a.score !== null,
      );
      const scores = corrected.map((a) => a.score!);
      return {
        levelSlug: level.slug as LevelSlug,
        levelLabel: level.label,
        attemptCount: levelAttempts.length,
        bestScore: scores.length ? Math.max(...scores) : null,
        lastScore: corrected[0]?.score ?? null,
      };
    });

    return { summary };
  });
}
