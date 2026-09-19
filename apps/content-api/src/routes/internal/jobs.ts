import type { FastifyInstance } from "fastify";
import {
  claimJobs,
  completeJob,
  deadJobs,
  deferJob,
  enqueueJob,
  failJob,
} from "../../lib/jobs";

/**
 * Durable job lease HTTP surface (§5). Workers never touch the Job table
 * directly — even within the Content plane they only ever reach content-api
 * over HTTP, same as every other stage — so this is the sole entry point.
 */
export async function registerInternalJobRoutes(app: FastifyInstance): Promise<void> {
  app.post<{
    Body: {
      kind: string;
      entityId: string;
      dedupeKey: string;
      priority?: number;
      availableAt?: string;
      maxAttempts?: number;
      correlationId?: string;
      causationId?: string;
    };
  }>("/internal/jobs/enqueue", async (request) => {
    const body = request.body;
    if (!body?.kind || !body.entityId || !body.dedupeKey) {
      throw Object.assign(new Error("kind, entityId, and dedupeKey are required"), {
        statusCode: 400,
      });
    }
    const job = await enqueueJob({
      kind: body.kind,
      entityId: body.entityId,
      dedupeKey: body.dedupeKey,
      priority: body.priority,
      availableAt: body.availableAt ? new Date(body.availableAt) : undefined,
      maxAttempts: body.maxAttempts,
      correlationId: body.correlationId,
      causationId: body.causationId,
    });
    return { job };
  });

  app.post<{ Body: { kind: string; leaseOwner: string; batchSize?: number; leaseMs?: number } }>(
    "/internal/jobs/claim",
    async (request) => {
      const body = request.body;
      if (!body?.kind || !body.leaseOwner) {
        throw Object.assign(new Error("kind and leaseOwner are required"), { statusCode: 400 });
      }
      const jobs = await claimJobs({
        kind: body.kind,
        leaseOwner: body.leaseOwner,
        batchSize: body.batchSize,
        leaseMs: body.leaseMs,
      });
      return { jobs };
    },
  );

  app.post<{ Params: { id: string } }>("/internal/jobs/:id/complete", async (request) => {
    const job = await completeJob(request.params.id);
    return { job };
  });

  app.post<{ Params: { id: string }; Body: { availableAt: string; errorCode?: string; error?: string } }>(
    "/internal/jobs/:id/defer",
    async (request) => {
      const body = request.body;
      if (!body?.availableAt) {
        throw Object.assign(new Error("availableAt is required"), { statusCode: 400 });
      }
      const job = await deferJob({
        id: request.params.id,
        availableAt: new Date(body.availableAt),
        errorCode: body.errorCode,
        error: body.error,
      });
      return { job };
    },
  );

  app.post<{ Params: { id: string }; Body: { errorCode?: string; error?: string } }>(
    "/internal/jobs/:id/fail",
    async (request) => {
      const job = await failJob({
        id: request.params.id,
        errorCode: request.body?.errorCode,
        error: request.body?.error,
      });
      return { job };
    },
  );

  /** Dead-letter view (§5): terminal failures stay inspectable, never silent. */
  app.get("/internal/jobs/dead", async (request) => {
    const q = request.query as { kind?: string; limit?: string };
    const jobs = await deadJobs(q.kind, Number(q.limit || 50));
    return { jobs };
  });
}
