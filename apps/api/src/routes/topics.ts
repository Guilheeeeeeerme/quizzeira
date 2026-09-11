import type { FastifyInstance } from "fastify";
import type {
  CreateTopicInput,
  LocaleCode,
  SessionDurationMinutes,
  UpdateTopicInput,
} from "@quizzeira/shared";
import { authenticate } from "../plugins/auth";
import {
  deleteTopic,
  getTopic,
  listTopics,
  updateTopic,
} from "../services/topic.service";
import { getPillAttempt, startPill } from "../services/pill.service";
import { guardedCreateTopic } from "./exams";
import { assertOpenExamOnlyPreset } from "../services/exam-catalog.service";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function topicRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/topics", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    return { topics: await listTopics(request.userId) };
  });

  app.post<{ Body: CreateTopicInput }>("/topics", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      return await guardedCreateTopic(request.userId, request.body ?? ({} as CreateTopicInput));
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get<{ Params: { topicId: string } }>("/topics/:topicId", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      return await getTopic(request.userId, request.params.topicId);
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.patch<{ Params: { topicId: string }; Body: UpdateTopicInput }>(
    "/topics/:topicId",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      try {
        if (request.body?.presetSlug !== undefined) {
          assertOpenExamOnlyPreset(request.body.presetSlug);
        }
        return await updateTopic(request.userId, request.params.topicId, request.body ?? {});
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.delete<{ Params: { topicId: string } }>("/topics/:topicId", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      await deleteTopic(request.userId, request.params.topicId);
      return { ok: true };
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{
    Params: { topicId: string };
    Body: { focusText?: string; durationMinutes?: SessionDurationMinutes | null; locale?: LocaleCode };
  }>("/topics/:topicId/pills/start", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      return await startPill(request.userId, request.params.topicId, request.body ?? {});
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get<{ Params: { attemptId: string } }>(
    "/pills/:attemptId",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      try {
        return await getPillAttempt(request.userId, request.params.attemptId);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );
}
