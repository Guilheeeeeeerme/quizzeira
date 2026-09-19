// Concept: HITL — the admin control plane.
//
// discovery-api and content-api have no public ingress. Every admin action goes
// through here so it is checked against a real ADMIN session first; this file is
// mostly a proxy (paths mirror upstream), plus local study-plane user provisioning.
import type { FastifyInstance } from "fastify";
import type { PromptKey } from "@quizzeira/shared";
import { requireAdmin } from "../plugins/auth";
import {
  approvePromptProposal,
  isPromptKey,
  listPromptProposals,
  rejectPromptProposal,
} from "../services/prompt-store";
import { createStudyUser, listAdminUsers } from "../services/admin-users";
import { contentFetch, discoveryFetch } from "../lib/pipeline-clients";

function httpError(err: unknown, reply: { code: (n: number) => { send: (b: unknown) => unknown } }) {
  const error = err as { statusCode?: number; message?: string };
  return reply.code(error.statusCode ?? 500).send({ error: error.message ?? "Error" });
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireAdmin);

  // Study-plane users (local MySQL). Always create role USER — study only.
  app.get("/admin/users", async () => listAdminUsers());

  app.post<{
    Body: { email?: string; password?: string; displayName?: string; role?: string };
  }>("/admin/users", async (request, reply) => {
    const result = await createStudyUser(request.body ?? {});
    if (!result.ok) {
      return reply.code(result.status).send({ error: result.error });
    }
    return { user: result.user };
  });

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

  /**
   * Discovery's exam list joined with Content's per-exam funnel (documents,
   * syllabus, previous questions, items, last generation error) so the card
   * explains "400 files, 0 questions" without a click. Content being down
   * degrades to `pipeline: null` rather than hiding the exams.
   */
  app.get("/admin/exams", async (request, reply) => {
    const q = request.query as { status?: string; limit?: string };
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.limit) params.set("limit", q.limit);
    const suffix = params.size ? `?${params}` : "";
    try {
      const [exams, summary] = await Promise.all([
        discoveryFetch<{ items: Array<Record<string, unknown> & { examSlug: string }> }>(
          `/admin/exams${suffix}`,
        ),
        contentFetch<{ items: Record<string, unknown> }>("/admin/exams/summary").catch(
          () => ({ items: {} as Record<string, unknown> }),
        ),
      ]);
      return {
        items: exams.items.map((e) => ({ ...e, pipeline: summary.items[e.examSlug] ?? null })),
      };
    } catch (err) {
      return httpError(err, reply);
    }
  });

  /**
   * Every file of one exam: crawler artifact ⨝ content document (by artifact
   * id, falling back to URL). Rows with no document never left Discovery;
   * documents with no artifact were imported by hand or predate the join key.
   */
  app.get<{ Params: { id: string } }>("/admin/exams/:id/files", async (request, reply) => {
    try {
      const artifacts = await discoveryFetch<{
        exam: { id: string; examSlug: string; title: string };
        items: Array<Record<string, unknown> & { id: string; url: string | null }>;
      }>(`/admin/exams/${encodeURIComponent(request.params.id)}/artifacts`);
      const documents = await contentFetch<{
        items: Array<
          Record<string, unknown> & {
            id: string;
            discoveryArtifactId: string | null;
            sourceUrl: string | null;
          }
        >;
      }>(`/admin/exams/${encodeURIComponent(artifacts.exam.examSlug)}/documents`).catch(() => ({
        items: [],
      }));
      const byArtifact = new Map(
        documents.items.filter((d) => d.discoveryArtifactId).map((d) => [d.discoveryArtifactId!, d]),
      );
      const byUrl = new Map(
        documents.items.filter((d) => d.sourceUrl).map((d) => [d.sourceUrl!, d]),
      );
      const used = new Set<string>();
      const files = artifacts.items.map((a) => {
        const doc = byArtifact.get(a.id) ?? (a.url ? byUrl.get(a.url) : undefined) ?? null;
        if (doc) used.add(doc.id);
        return { artifact: a, document: doc };
      });
      for (const doc of documents.items) {
        if (!used.has(doc.id)) files.push({ artifact: null as never, document: doc });
      }
      return { exam: artifacts.exam, files };
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

  app.get("/admin/topic-queries", async (request, reply) => {
    const q = request.query as { status?: string; limit?: string };
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.limit) params.set("limit", q.limit);
    const suffix = params.size ? `?${params}` : "";
    try {
      return await discoveryFetch(`/admin/topic-queries${suffix}`);
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
    const q = request.query as { status?: string; limit?: string; examSlug?: string; role?: string };
    const params = new URLSearchParams();
    if (q.status) params.set("status", q.status);
    if (q.limit) params.set("limit", q.limit);
    if (q.examSlug) params.set("examSlug", q.examSlug);
    if (q.role) params.set("role", q.role);
    const suffix = params.size ? `?${params}` : "";
    try {
      return await contentFetch(`/admin/documents${suffix}`);
    } catch (err) {
      return httpError(err, reply);
    }
  });

  /** Human label for a file: closed role/kind enums, validated by content-api. */
  app.patch<{ Params: { id: string }; Body: { role?: string; kind?: string; reprocess?: boolean } }>(
    "/admin/content/documents/:id",
    async (request, reply) => {
      try {
        return await contentFetch(`/admin/documents/${encodeURIComponent(request.params.id)}`, {
          method: "PATCH",
          body: JSON.stringify(request.body ?? {}),
        });
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/admin/content/documents/:id",
    async (request, reply) => {
      try {
        return await contentFetch(`/admin/documents/${encodeURIComponent(request.params.id)}`);
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/admin/content/question-items/:id/provenance",
    async (request, reply) => {
      try {
        return await contentFetch(
          `/internal/question-items/${encodeURIComponent(request.params.id)}/provenance`,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get<{ Params: { examSlug: string } }>(
    "/admin/content/exams/:examSlug/syllabus",
    async (request, reply) => {
      try {
        return await contentFetch(
          `/published/exams/${encodeURIComponent(request.params.examSlug)}/syllabus`,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get<{ Params: { examSlug: string } }>(
    "/admin/content/exams/:examSlug/coverage",
    async (request, reply) => {
      try {
        return await contentFetch(
          `/admin/syllabi/${encodeURIComponent(request.params.examSlug)}`,
        );
      } catch (err) {
        return httpError(err, reply);
      }
    },
  );

  app.get("/admin/content/metrics/pipeline", async (request, reply) => {
    const q = request.query as { hours?: string };
    const params = new URLSearchParams();
    if (q.hours) params.set("hours", q.hours);
    const suffix = params.size ? `?${params}` : "";
    try {
      return await contentFetch(`/admin/metrics/pipeline${suffix}`);
    } catch (err) {
      return httpError(err, reply);
    }
  });
}
