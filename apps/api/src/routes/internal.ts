import type { FastifyInstance } from "fastify";
import type {
  AttemptCorrectionInput,
  GenerationCompleteInput,
  QuestionUpdateInput,
} from "@quizzeira/shared";
import { authenticateInternal } from "../plugins/internal-auth";
import {
  getPrompt,
  getPromptHistory,
  isPromptKey,
  proposePrompt,
} from "../services/prompt-store";
import {
  claimNextPendingAttempt,
  completeAttemptCorrection,
  nextQuestionForUpdate,
  proposeQuestionUpdate,
  releaseAttempt,
} from "../services/internal.service";
import {
  claimNextGeneratingAttempt,
  completePillGeneration,
  releaseGeneratingAttempt,
} from "../services/pill.service";
import { purgeStaleTopics } from "../services/topic.service";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateInternal);

  app.get("/health", async () => ({ status: "ok", zone: "dmz" }));

  app.get<{ Params: { key: string } }>("/prompts/:key", async (request, reply) => {
    if (!isPromptKey(request.params.key)) {
      return reply.code(400).send({ error: "Unknown prompt key" });
    }
    return getPrompt(request.params.key);
  });

  app.get<{ Params: { key: string } }>("/prompts/:key/history", async (request, reply) => {
    if (!isPromptKey(request.params.key)) {
      return reply.code(400).send({ error: "Unknown prompt key" });
    }
    return { items: await getPromptHistory(request.params.key) };
  });

  app.put<{ Params: { key: string }; Body: { body?: string; note?: string } }>(
    "/prompts/:key",
    async (request, reply) => {
      if (!isPromptKey(request.params.key)) {
        return reply.code(400).send({ error: "Unknown prompt key" });
      }
      const body = request.body?.body?.trim();
      if (!body) return reply.code(400).send({ error: "body required" });
      // HITL: internal PUT stages a proposal; live apply is admin-only.
      return proposePrompt(request.params.key, body, request.body?.note);
    },
  );

  app.post("/reviews/claim", async () => {
    const attempt = await claimNextPendingAttempt();
    return { attempt };
  });

  app.post<{ Params: { attemptId: string } }>(
    "/reviews/:attemptId/release",
    async (request, reply) => {
      try {
        return await releaseAttempt(request.params.attemptId);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { attemptId: string }; Body: AttemptCorrectionInput }>(
    "/reviews/:attemptId/complete",
    async (request, reply) => {
      const { answers, generalComment } = request.body ?? {};
      if (!Array.isArray(answers) || typeof generalComment !== "string") {
        return reply.code(400).send({ error: "answers and generalComment required" });
      }
      try {
        return await completeAttemptCorrection(request.params.attemptId, {
          answers,
          generalComment,
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post("/pills/claim", async () => {
    const attempt = await claimNextGeneratingAttempt();
    return { attempt };
  });

  app.post<{ Params: { attemptId: string } }>(
    "/pills/:attemptId/release",
    async (request, reply) => {
      try {
        return await releaseGeneratingAttempt(request.params.attemptId);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { attemptId: string }; Body: GenerationCompleteInput }>(
    "/pills/:attemptId/complete",
    async (request, reply) => {
      const questions = request.body?.questions;
      if (!Array.isArray(questions)) {
        return reply.code(400).send({ error: "questions required" });
      }
      try {
        return await completePillGeneration(request.params.attemptId, { questions });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post("/topics/purge-stale", async () => purgeStaleTopics());

  app.get("/questions/next-for-update", async () => {
    const question = await nextQuestionForUpdate();
    return { question };
  });

  app.post<{ Params: { id: string }; Body: QuestionUpdateInput & { reason?: string } }>(
    "/questions/:id/proposals",
    async (request, reply) => {
      try {
        const { reason, ...patch } = request.body ?? {};
        return await proposeQuestionUpdate(request.params.id, patch, reason);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );
}
