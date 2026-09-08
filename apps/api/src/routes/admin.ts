import type { FastifyInstance } from "fastify";
import type { PromptKey } from "@quizzeira/shared";
import { requireAdmin } from "../plugins/auth";
import {
  approveQuestionProposal,
  listQuestionProposals,
  rejectQuestionProposal,
} from "../services/internal.service";
import {
  approvePromptProposal,
  isPromptKey,
  listPromptProposals,
  rejectPromptProposal,
} from "../services/prompt-store";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  app.get("/admin/proposals/questions", async () => {
    const items = await listQuestionProposals("PENDING");
    return { items };
  });

  app.post<{ Params: { id: string } }>(
    "/admin/proposals/questions/:id/approve",
    async (request, reply) => {
      try {
        return await approveQuestionProposal(request.params.id, request.userId!);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/admin/proposals/questions/:id/reject",
    async (request, reply) => {
      try {
        return await rejectQuestionProposal(request.params.id, request.userId!);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get("/admin/proposals/prompts", async () => {
    const items = await listPromptProposals();
    return { items };
  });

  app.post<{ Params: { key: string } }>(
    "/admin/proposals/prompts/:key/approve",
    async (request, reply) => {
      if (!isPromptKey(request.params.key)) {
        return reply.code(400).send({ error: "Unknown prompt key" });
      }
      try {
        return await approvePromptProposal(request.params.key as PromptKey);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { key: string } }>(
    "/admin/proposals/prompts/:key/reject",
    async (request, reply) => {
      if (!isPromptKey(request.params.key)) {
        return reply.code(400).send({ error: "Unknown prompt key" });
      }
      try {
        return await rejectPromptProposal(request.params.key as PromptKey);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );
}

