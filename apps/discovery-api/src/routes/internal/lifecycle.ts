import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { deleteArtifactObject } from "../../lib/storage";

/** Mirrors the Prisma enum + apps/discovery-lifecycle ALLOWED_TRANSITIONS; the
 * route validates instead of letting an invalid enum surface as a Prisma 500. */
const LIFECYCLE_PHASES = new Set([
  "announced",
  "registration_open",
  "registration_closed",
  "exam_scheduled",
  "exam_done",
  "past_due",
  "cancelled",
  "archived",
]);
const REGISTRATION_STATUSES = new Set(["open", "closed", "unknown"]);

function phaseToStatus(phase: string): "open" | "closed" | "unknown" {
  if (phase === "registration_open") return "open";
  if (phase === "announced") return "unknown";
  return "closed";
}

function examLifecycleWire(row: {
  id: string;
  examSlug: string;
  status: string;
  lifecyclePhase: string;
  registrationStart: Date | null;
  registrationEnd: Date | null;
  examDate: Date | null;
  archivedAt: Date | null;
  purgeEligibleAt: Date | null;
  statusSource: string | null;
}) {
  return {
    id: row.id,
    examSlug: row.examSlug,
    status: row.status,
    lifecyclePhase: row.lifecyclePhase,
    registrationStart: row.registrationStart?.toISOString() ?? null,
    registrationEnd: row.registrationEnd?.toISOString() ?? null,
    examDate: row.examDate?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    purgeEligibleAt: row.purgeEligibleAt?.toISOString() ?? null,
    statusSource: row.statusSource,
  };
}

/**
 * Internal contract for discovery-lifecycle worker.
 * Discovery-plane only — purge never touches Study/Content schemas.
 */
export async function registerInternalLifecycleRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Exams the worker still has something to decide about. Archived exams only
   * come back once their hard-delete date has passed; otherwise a few hundred
   * idle archives would fill every batch and starve the live ones.
   */
  app.get<{ Querystring: { limit?: string; hardDeleteGraceDays?: string } }>(
    "/internal/lifecycle/exams",
    async (request) => {
      const limit = Math.min(Number(request.query.limit || 50) || 50, 200);
      const graceDays = Math.max(1, Number(request.query.hardDeleteGraceDays || 90) || 90);
      const hardDeleteBefore = new Date(Date.now() - graceDays * 86_400_000);
      const items = await prisma.exam.findMany({
        where: {
          OR: [
            { lifecyclePhase: { not: "archived" } },
            { lifecyclePhase: "archived", archivedAt: { lte: hardDeleteBefore } },
          ],
        },
        orderBy: [{ purgeEligibleAt: "asc" }, { lastSeenAt: "asc" }],
        take: limit,
      });
      return { items: items.map(examLifecycleWire) };
    },
  );

  app.post<{ Body: Record<string, unknown> }>("/internal/lifecycle/transition", async (request) => {
    const body = request.body ?? {};
    const examId = String(body.examId || "");
    const to = String(body.to || "");
    if (!examId || !to) {
      throw Object.assign(new Error("examId and to required"), { statusCode: 400 });
    }
    if (!LIFECYCLE_PHASES.has(to)) {
      throw Object.assign(new Error(`invalid lifecycle phase: ${to}`), { statusCode: 400 });
    }
    if (
      body.registrationStatus !== undefined &&
      !REGISTRATION_STATUSES.has(String(body.registrationStatus))
    ) {
      throw Object.assign(new Error("invalid registrationStatus"), { statusCode: 400 });
    }
    const existing = await prisma.exam.findUnique({ where: { id: examId } });
    if (!existing) {
      throw Object.assign(new Error("exam not found"), { statusCode: 404 });
    }
    if (existing.lifecyclePhase === to) {
      return { ok: true, noop: true };
    }

    const registrationStatus =
      (body.registrationStatus as string) || phaseToStatus(to);
    const data: {
      lifecyclePhase: never;
      status: never;
      purgeEligibleAt?: Date | null;
      archivedAt?: Date | null;
    } = {
      lifecyclePhase: to as never,
      status: registrationStatus as never,
    };
    if (body.purgeEligibleAt !== undefined) {
      data.purgeEligibleAt = body.purgeEligibleAt
        ? new Date(String(body.purgeEligibleAt))
        : null;
    }
    if (body.archivedAt !== undefined) {
      data.archivedAt = body.archivedAt ? new Date(String(body.archivedAt)) : null;
    }

    await prisma.exam.update({ where: { id: examId }, data });
    return { ok: true, noop: false, reason: body.reason ?? null };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/lifecycle/purge", async (request) => {
    const body = request.body ?? {};
    const examId = String(body.examId || "");
    if (!examId) {
      throw Object.assign(new Error("examId required"), { statusCode: 400 });
    }

    let deletedArtifacts = 0;
    let deletedObjects = 0;
    let keptObjects = 0;
    if (body.deleteArtifacts || body.deleteMinioObjects) {
      const artifacts = await prisma.artifact.findMany({ where: { examId } });
      const failedKeys = new Set<string>();
      if (body.deleteMinioObjects) {
        // Objects are content-addressed (artifacts/<sha256>) and the SAME key
        // is copied into Content's Document.storageKey at import. So an object
        // is only ours to delete when (a) it was never imported into Content
        // (published=false — Content's retention pass owns the bytes after
        // import) and (b) no artifact of another exam still points at it.
        const keys = Array.from(
          new Set(artifacts.map((a) => a.storageKey).filter((k): k is string => Boolean(k))),
        );
        const otherHolders = keys.length
          ? await prisma.artifact.groupBy({
              by: ["storageKey"],
              where: { storageKey: { in: keys }, NOT: { examId } },
              _count: { _all: true },
            })
          : [];
        const shared = new Set(otherHolders.map((h) => h.storageKey));
        const imported = new Set(
          artifacts.filter((a) => a.published && a.storageKey).map((a) => a.storageKey!),
        );
        for (const key of keys) {
          if (shared.has(key) || imported.has(key)) {
            keptObjects += 1;
            continue;
          }
          try {
            await deleteArtifactObject(key);
            deletedObjects += 1;
          } catch (err) {
            // Keep the row so the object stays findable; retry next pass.
            failedKeys.add(key);
            request.log.warn({ examId, storageKey: key, err }, "lifecycle purge: object delete failed");
          }
        }
      }
      if (body.deleteArtifacts) {
        const result = await prisma.artifact.deleteMany({
          where: {
            examId,
            ...(failedKeys.size
              ? { OR: [{ storageKey: null }, { storageKey: { notIn: Array.from(failedKeys) } }] }
              : {}),
          },
        });
        deletedArtifacts = result.count;
      }
    }

    if (body.deleteTopicQueries) {
      await prisma.topicQuery.deleteMany({ where: { examId } });
    }

    // Content/Study reference the exam by examSlug (no FK), so dropping the
    // tombstone orphans their rows for that slug. Off by default in the worker.
    if (body.deleteExamTombstone) {
      const remaining = await prisma.artifact.count({ where: { examId } });
      if (remaining > 0) {
        throw Object.assign(new Error("exam still has artifacts; purge them first"), {
          statusCode: 409,
        });
      }
      await prisma.exam.delete({ where: { id: examId } });
    }

    return { ok: true, deletedArtifacts, deletedObjects, keptObjects };
  });
}
