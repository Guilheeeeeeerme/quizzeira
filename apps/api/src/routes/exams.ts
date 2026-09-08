import type { FastifyInstance } from "fastify";
import type { CreateTopicInput, LocaleCode } from "@quizzeira/shared";
import { normalizeLocale } from "@quizzeira/shared";
import { authenticate } from "../plugins/auth";
import {
  assertOpenExamOnlyPreset,
  getExamCatalogItem,
  listExamCatalog,
  prepareExamStudy,
} from "../services/exam-catalog.service";
import { createTopic } from "../services/topic.service";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

async function listExamsHandler(
  request: { userId?: string },
  reply: { code: (n: number) => { send: (b: unknown) => unknown } },
) {
  if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
  try {
    const exams = await listExamCatalog();
    return { exams };
  } catch (err) {
    return httpError(err, reply);
  }
}

export async function examRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  app.get("/exams", listExamsHandler);

  app.get<{ Params: { id: string } }>("/exams/:id", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      return await getExamCatalogItem(request.params.id);
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{
    Params: { id: string };
    Body: { locale?: LocaleCode | string };
  }>("/exams/:id/prepare", async (request, reply) => {
    if (!request.userId) return reply.code(401).send({ error: "Unauthorized" });
    try {
      const locale = normalizeLocale(request.body?.locale);
      return await prepareExamStudy(request.userId, request.params.id, locale);
    } catch (err) {
      return httpError(err, reply);
    }
  });
}

/** Wrap topic create to soft-enforce open-exam-only preset in this product phase. */
export async function guardedCreateTopic(userId: string, input: CreateTopicInput) {
  assertOpenExamOnlyPreset(input.presetSlug ?? "open_exam");
  return createTopic(userId, {
    ...input,
    presetSlug: input.presetSlug ?? "open_exam",
  });
}
