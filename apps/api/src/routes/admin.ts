// Concept: HITL — the admin control plane.
//
// discovery-api and content-api have no public ingress. Every admin action goes
// through here so it is checked against a real ADMIN session first; this file is
// only a proxy, and the paths below mirror the upstream routes one-for-one.
import type { FastifyInstance } from "fastify";
import type { PromptKey } from "@quizzeira/shared";
import { requireAdmin } from "../plugins/auth";
import {
  approvePromptProposal,
  isPromptKey,
  listPromptProposals,
  rejectPromptProposal,
} from "../services/prompt-store";
import { contentFetch, discoveryFetch } from "../lib/pipeline-clients";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  // Concept: Prompt registry — proposals are staged by workers, applied here.
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

  // Concept: Source registry (discovery-api)
  app.get("/admin/sources", async (_request, reply) => {
    try {
      return await discoveryFetch("/admin/sources");
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{ Body: Record<string, unknown> }>("/admin/sources", async (request, reply) => {
    try {
      return await discoveryFetch("/admin/sources", {
        method: "POST",
        body: JSON.stringify(request.body ?? {}),
      });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/admin/sources/:id",
    async (request, reply) => {
      try {
        return await discoveryFetch(`/admin/sources/${request.params.id}`, {
          method: "PATCH",
          body: JSON.stringify(request.body ?? {}),
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.delete<{ Params: { id: string } }>("/admin/sources/:id", async (request, reply) => {
    try {
      return await discoveryFetch(`/admin/sources/${request.params.id}`, { method: "DELETE" });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get("/admin/source-proposals", async (_request, reply) => {
    try {
      return await discoveryFetch("/admin/source-proposals");
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.post<{ Params: { id: string } }>(
    "/admin/source-proposals/:id/approve",
    async (request, reply) => {
      try {
        return await discoveryFetch(`/admin/source-proposals/${request.params.id}/approve`, {
          method: "POST",
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/admin/source-proposals/:id/reject",
    async (request, reply) => {
      try {
        return await discoveryFetch(`/admin/source-proposals/${request.params.id}/reject`, {
          method: "POST",
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get("/admin/exams", async (request, reply) => {
    const q = request.query as { status?: string; limit?: string };
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.limit) params.set("limit", q.limit);
    const suffix = params.size ? `?${params}` : "";
    try {
      return await discoveryFetch(`/admin/exams${suffix}`);
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.patch<{ Params: { id: string }; Body: { status?: string } }>(
    "/admin/exams/:id",
    async (request, reply) => {
      try {
        return await discoveryFetch(`/admin/exams/${request.params.id}`, {
          method: "PATCH",
          body: JSON.stringify(request.body ?? {}),
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  /** Queue a crawl that ignores the per-source interval. */
  app.post<{ Body: { sourceId?: string } }>("/admin/crawl/force", async (request, reply) => {
    try {
      return await discoveryFetch("/admin/crawl/force", {
        method: "POST",
        body: JSON.stringify(request.body ?? {}),
      });
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get("/admin/runs", async (_request, reply) => {
    try {
      return await discoveryFetch("/admin/runs");
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get("/admin/discovery/health", async (_request, reply) => {
    try {
      return await discoveryFetch("/admin/health");
    } catch (err) {
      return httpError(err, reply);
    }
  });

  // Concept: HITL — the queue of items the Eval stage rejected or deferred.
  app.get("/admin/quality/queue", async (request, reply) => {
    const q = request.query as { status?: string; examSlug?: string; limit?: string };
    const params = new URLSearchParams();
    for (const key of ["status", "examSlug", "limit"] as const) {
      if (q[key]) params.set(key, q[key]!);
    }
    const suffix = params.size ? `?${params}` : "";
    try {
      return await contentFetch(`/admin/quality/queue${suffix}`);
    } catch (err) {
      return httpError(err, reply);
    }
  });

  /** Publish-gate override. The audit row upstream records who decided. */
  app.post<{ Params: { id: string }; Body: { decision?: string; notes?: string } }>(
    "/admin/quality/queue/:id",
    async (request, reply) => {
      try {
        return await contentFetch(`/admin/quality/queue/${request.params.id}`, {
          method: "POST",
          body: JSON.stringify({
            ...request.body,
            notes: request.body?.notes || `admin override by ${request.userId}`,
          }),
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/admin/quality/queue/:id/requeue",
    async (request, reply) => {
      try {
        return await contentFetch(`/admin/quality/queue/${request.params.id}/requeue`, {
          method: "POST",
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get("/admin/content/health", async (_request, reply) => {
    try {
      return await contentFetch("/admin/health");
    } catch (err) {
      return httpError(err, reply);
    }
  });

  app.get("/admin/content/documents", async (request, reply) => {
    const q = request.query as { status?: string; limit?: string };
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.limit) params.set("limit", q.limit);
    const suffix = params.size ? `?${params}` : "";
    try {
      return await contentFetch(`/admin/documents${suffix}`);
    } catch (err) {
      return httpError(err, reply);
    }
  });
}
