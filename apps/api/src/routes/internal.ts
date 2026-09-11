// Concept: Grading (worker-facing surface of the study API)
//
// After the refactor quiz-corrector is the only worker that talks to this API.
// Ingestion lives in discovery-api and everything about producing questions
// lives in content-api, so there are no bank, crawler or generation endpoints
// here any more.
import type { FastifyInstance } from "fastify";
import type { AttemptCorrectionInput } from "@quizzeira/shared";
import { authenticateInternal } from "../plugins/internal-auth";
import { getPrompt, getPromptHistory, isPromptKey, proposePrompt } from "../services/prompt-store";
import {
  claimNextPendingAttempt,
  completeAttemptCorrection,
  releaseAttempt,
} from "../services/internal.service";
import { purgeStaleTopics } from "../services/topic.service";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function internalRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticateInternal);

  app.get("/health", async () => ({ status: "ok", zone: "dmz" }));

  // ── Prompts ───────────────────────────────────────────────────────────────

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
      // HITL: an internal PUT only stages a proposal; applying it is admin-only.
      return proposePrompt(request.params.key, body, request.body?.note);
    },
  );

  // ── Grading (quiz-corrector) ──────────────────────────────────────────────

  app.post("/reviews/claim", async () => ({ attempt: await claimNextPendingAttempt() }));

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

  // ── Housekeeping ──────────────────────────────────────────────────────────

  app.post("/topics/purge-stale", async () => purgeStaleTopics());
}
