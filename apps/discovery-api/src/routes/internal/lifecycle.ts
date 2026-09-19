import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { deleteArtifactObject } from "../../lib/storage";

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
  app.get<{ Querystring: { limit?: string } }>("/internal/lifecycle/exams", async (request) => {
    const limit = Math.min(Number(request.query.limit || 50) || 50, 200);
    const items = await prisma.exam.findMany({
      orderBy: [{ purgeEligibleAt: "asc" }, { lastSeenAt: "asc" }],
      take: limit,
    });
    return { items: items.map(examLifecycleWire) };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/lifecycle/transition", async (request) => {
    const body = request.body ?? {};
    const examId = String(body.examId || "");
    const to = String(body.to || "");
    if (!examId || !to) {
      throw Object.assign(new Error("examId and to required"), { statusCode: 400 });
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
    if (body.deleteArtifacts || body.deleteMinioObjects) {
      const artifacts = await prisma.artifact.findMany({ where: { examId } });
      for (const artifact of artifacts) {
        if (body.deleteMinioObjects && artifact.storageKey) {
          await deleteArtifactObject(artifact.storageKey).catch(() => undefined);
        }
      }
      if (body.deleteArtifacts) {
        const result = await prisma.artifact.deleteMany({ where: { examId } });
        deletedArtifacts = result.count;
      }
    }

    if (body.deleteTopicQueries) {
      await prisma.topicQuery.deleteMany({ where: { examId } });
    }

    if (body.deleteExamTombstone) {
      await prisma.exam.delete({ where: { id: examId } });
    }

    return { ok: true, deletedArtifacts };
  });
}
