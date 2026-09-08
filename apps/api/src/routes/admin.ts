import type { FastifyInstance } from "fastify";
import type { PromptKey } from "@quizzeira/shared";
import { requireAdmin } from "../plugins/auth";
import {
  approveBankDepositProposal,
  listBankDepositProposals,
  rejectBankDepositProposal,
} from "../services/bank-proposal.store";
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
import { crawlerForceRunKey } from "@quizzeira/shared";
import { redis } from "../lib/redis";
import { questionBankOverview } from "../services/question-bank.service";
import {
  getCrawlerObservability,
  listCrawlerSources,
  proposeCrawlerSource,
  upsertCrawlerSource,
} from "../services/crawler-registry.store";

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

  app.get("/admin/proposals/bank", async () => {
    const items = await listBankDepositProposals();
    return { items };
  });

  app.post<{ Params: { id: string } }>(
    "/admin/proposals/bank/:id/approve",
    async (request, reply) => {
      try {
        return await approveBankDepositProposal(request.params.id);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/admin/proposals/bank/:id/reject",
    async (request, reply) => {
      try {
        return await rejectBankDepositProposal(request.params.id);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get<{ Querystring: { examSlug?: string } }>(
    "/admin/question-bank/stats",
    async (request) => questionBankOverview(request.query.examSlug),
  );

  app.get("/admin/crawler/status", async () => getCrawlerObservability());

  app.get("/admin/crawler/sources", async () => {
    const items = await listCrawlerSources();
    return { items };
  });

  app.post<{
    Body: { url?: string; name?: string; notes?: string; activate?: boolean };
  }>("/admin/crawler/sources/propose", async (request, reply) => {
    if (!request.body?.url?.trim()) {
      return reply.code(400).send({ error: "url required" });
    }
    const result = await proposeCrawlerSource({
      url: request.body.url.trim(),
      name: request.body.name,
      notes: request.body.notes,
    });
    if (result.proposed && result.source && request.body.activate) {
      const source = await upsertCrawlerSource({
        ...result.source,
        status: "active",
        trust: "medium",
      });
      return { proposed: true, source };
    }
    return result;
  });

  /** Soft trigger: set a Redis flag the crawler checks each tick. */
  app.post("/admin/crawler/run-now", async () => {
    await redis.set(crawlerForceRunKey(), "1", "EX", 3600);
    return { queued: true };
  });
}


