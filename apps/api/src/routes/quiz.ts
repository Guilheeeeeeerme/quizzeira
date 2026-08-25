import type { FastifyInstance } from "fastify";
import { authenticate } from "../plugins/auth";
import { env } from "../lib/env";
import {
  correctAttempt,
  getQuizResults,
  startQuiz,
  submitQuiz,
} from "../services/quiz.service";
import type { SubmitAnswer } from "@quiz-app/shared";
import { prisma } from "../lib/prisma";

export async function quizRoutes(app: FastifyInstance) {
  app.get("/levels", { preHandler: authenticate }, async () => {
    const levels = await prisma.difficultyLevel.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, slug: true, label: true, sortOrder: true },
    });
    return { levels };
  });

  app.post<{ Body: { levelSlug: string } }>(
    "/quiz/start",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      const { levelSlug } = request.body ?? {};
      if (!levelSlug) return reply.code(400).send({ error: "levelSlug required" });

      try {
        return await startQuiz(request.userId, levelSlug);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
      }
    },
  );

  app.post<{ Params: { attemptId: string }; Body: { answers: SubmitAnswer[] } }>(
    "/quiz/:attemptId/submit",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      const { answers } = request.body ?? {};
      if (!Array.isArray(answers)) {
        return reply.code(400).send({ error: "answers array required" });
      }

      try {
        return await submitQuiz(request.userId, request.params.attemptId, answers);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
      }
    },
  );

  app.get<{ Params: { attemptId: string } }>(
    "/quiz/:attemptId/results",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });

      try {
        return await getQuizResults(request.userId, request.params.attemptId);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
      }
    },
  );

  app.post<{ Params: { attemptId: string } }>(
    "/quiz/:attemptId/correct",
    async (request, reply) => {
      if (env.nodeEnv === "production") {
        return reply.code(403).send({ error: "Forbidden in production" });
      }

      try {
        return await correctAttempt(request.params.attemptId);
      } catch (err: unknown) {
        const error = err as { statusCode?: number; message?: string };
        return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
      }
    },
  );
}
