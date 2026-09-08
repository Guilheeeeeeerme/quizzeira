import type { FastifyInstance } from "fastify";
import type {
  CreateTopicInput,
  LocaleCode,
  SessionDurationMinutes,
  UpdateTopicInput,
} from "@quizzeira/shared";
import { authenticate } from "../plugins/auth";
import {
  addTopicAttachment,
  addTopicLink,
  deleteTopic,
  deleteTopicAttachment,
  deleteTopicLink,
  getTopic,
  listTopics,
  refreshTopicAttachmentExtractions,
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

  app.post<{ Params: { topicId: string }; Body: { url?: string; label?: string } }>(
    "/topics/:topicId/links",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      const url = request.body?.url?.trim();
      if (!url) return reply.code(400).send({ error: "url required" });
      try {
        return await addTopicLink(request.userId, request.params.topicId, url, request.body?.label);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.delete<{ Params: { topicId: string; linkId: string } }>(
    "/topics/:topicId/links/:linkId",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      try {
        return await deleteTopicLink(
          request.userId,
          request.params.topicId,
          request.params.linkId,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { topicId: string } }>(
    "/topics/:topicId/attachments",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      const file = await request.file();
      if (!file) return reply.code(400).send({ error: "file required" });
      const buffer = await file.toBuffer();
      try {
        return await addTopicAttachment(request.userId, request.params.topicId, {
          filename: file.filename,
          mimeType: file.mimetype,
          buffer,
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { topicId: string } }>(
    "/topics/:topicId/attachments/refresh",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      try {
        return await refreshTopicAttachmentExtractions(
          request.userId,
          request.params.topicId,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.delete<{ Params: { topicId: string; attachmentId: string } }>(
    "/topics/:topicId/attachments/:attachmentId",
    async (request, reply) => {
      if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
      try {
        return await deleteTopicAttachment(
          request.userId,
          request.params.topicId,
          request.params.attachmentId,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

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
