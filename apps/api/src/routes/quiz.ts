import type { FastifyInstance } from "fastify";
import { authenticate } from "../plugins/auth";
import { env } from "../lib/env";
import {
  correctAttempt,
  getQuizResults,
  submitQuiz,
} from "../services/quiz.service";
import type { SubmitAnswer } from "@quizzeira/shared";

export async function quizRoutes(app: FastifyInstance) {
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
