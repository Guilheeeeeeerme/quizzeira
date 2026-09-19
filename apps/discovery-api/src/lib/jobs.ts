import { prisma } from "./prisma";
import { computeBackoffMs } from "./backoff";

/**
 * Durable job lease layer (§5). Any async boundary in content-api enqueues a
 * `Job` row instead of a worker polling an entity table directly. Workers
 * claim rows atomically with `FOR UPDATE SKIP LOCKED`; a crashed lease simply
 * expires and the next claim call picks the row back up — there is no
 * separate recovery path to keep in sync.
 */

export type JobStatus = "queued" | "leased" | "deferred" | "done" | "dead";

export interface JobRecord {
  id: string;
  kind: string;
  entityId: string;
  dedupeKey: string;
  status: JobStatus;
  priority: number;
  availableAt: Date;
  leaseOwner: string | null;
  leaseExpiresAt: Date | null;
  attempts: number;
  maxAttempts: number;
  lastErrorCode: string | null;
  lastError: string | null;
  correlationId: string | null;
  causationId: string | null;
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
}

export interface EnqueueJobInput {
  kind: string;
  entityId: string;
  dedupeKey: string;
  priority?: number;
  availableAt?: Date;
  maxAttempts?: number;
  correlationId?: string;
  causationId?: string;
}

const DEFAULT_LEASE_MS = 5 * 60_000;
const DEFAULT_BATCH_SIZE = 5;

/**
 * Enqueue is idempotent per `dedupeKey`: re-enqueuing the same cause is a
 * no-op that returns the existing row untouched, so a duplicate trigger can
 * never reset a job's lease/attempt state.
 */
export async function enqueueJob(input: EnqueueJobInput): Promise<JobRecord> {
  return prisma.job.upsert({
    where: { dedupeKey: input.dedupeKey },
    create: {
      kind: input.kind,
      entityId: input.entityId,
      dedupeKey: input.dedupeKey,
      priority: input.priority ?? 0,
      availableAt: input.availableAt ?? new Date(),
      maxAttempts: input.maxAttempts ?? 5,
      correlationId: input.correlationId ?? null,
      causationId: input.causationId ?? null,
    },
    update: {},
  }) as Promise<JobRecord>;
}

export interface ClaimJobsInput {
  kind: string;
  leaseOwner: string;
  batchSize?: number;
  leaseMs?: number;
  now?: Date;
}

/**
 * Claim up to `batchSize` runnable jobs of `kind`: ones ready to run
 * (`queued`/`deferred` with `availableAt` due) plus ones whose previous
 * lease expired (a crashed or killed worker). `FOR UPDATE SKIP LOCKED` lets
 * concurrent workers claim disjoint batches without blocking each other.
 */
export async function claimJobs(input: ClaimJobsInput): Promise<JobRecord[]> {
  const now = input.now ?? new Date();
  const batchSize = input.batchSize ?? DEFAULT_BATCH_SIZE;
  const leaseExpiresAt = new Date(now.getTime() + (input.leaseMs ?? DEFAULT_LEASE_MS));

  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Job"
        WHERE "kind" = ${input.kind}
          AND (
            ("status" IN ('queued', 'deferred') AND "availableAt" <= ${now})
            OR ("status" = 'leased' AND "leaseExpiresAt" < ${now})
          )
        ORDER BY "priority" DESC, "availableAt" ASC
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      `;
      if (rows.length === 0) return [];
      const ids = rows.map((row) => row.id);
      await tx.job.updateMany({
        where: { id: { in: ids } },
        data: {
          status: "leased",
          leaseOwner: input.leaseOwner,
          leaseExpiresAt,
          attempts: { increment: 1 },
          startedAt: now,
        },
      });
      return tx.job.findMany({ where: { id: { in: ids } }, orderBy: { priority: "desc" } });
    },
    { timeout: 30_000 },
  ) as Promise<JobRecord[]>;
}

export async function completeJob(id: string): Promise<JobRecord> {
  return prisma.job.update({
    where: { id },
    data: { status: "done", finishedAt: new Date() },
  }) as Promise<JobRecord>;
}

export interface DeferJobInput {
  id: string;
  availableAt: Date;
  errorCode?: string;
  error?: string;
}

/** Push a job back without counting it as a failed attempt (e.g. provider outage). */
export async function deferJob(input: DeferJobInput): Promise<JobRecord> {
  return prisma.job.update({
    where: { id: input.id },
    data: {
      status: "deferred",
      availableAt: input.availableAt,
      lastErrorCode: input.errorCode?.slice(0, 100) ?? null,
      lastError: input.error?.slice(0, 1000) ?? null,
    },
  }) as Promise<JobRecord>;
}

export interface FailJobInput {
  id: string;
  errorCode?: string;
  error?: string;
  now?: Date;
}

/**
 * Record a failed attempt with error-class backoff + jitter (§5). A job that
 * has exhausted `maxAttempts` moves to `dead` — a terminal, inspectable
 * dead-letter state — instead of retrying forever or disappearing.
 */
export async function failJob(input: FailJobInput): Promise<JobRecord> {
  const now = input.now ?? new Date();
  const job = await prisma.job.findUniqueOrThrow({ where: { id: input.id } });
  const lastErrorCode = input.errorCode?.slice(0, 100) ?? null;
  const lastError = input.error?.slice(0, 1000) ?? null;
  if (job.attempts >= job.maxAttempts) {
    return prisma.job.update({
      where: { id: input.id },
      data: { status: "dead", finishedAt: now, lastErrorCode, lastError },
    }) as Promise<JobRecord>;
  }
  const availableAt = new Date(now.getTime() + computeBackoffMs(job.attempts));
  return prisma.job.update({
    where: { id: input.id },
    data: { status: "queued", availableAt, lastErrorCode, lastError },
  }) as Promise<JobRecord>;
}

export async function deadJobs(kind?: string, limit = 50): Promise<JobRecord[]> {
  return prisma.job.findMany({
    where: { status: "dead", ...(kind ? { kind } : {}) },
    orderBy: { finishedAt: "desc" },
    take: Math.min(200, limit),
  }) as Promise<JobRecord[]>;
}
