import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { backfillCanonicalBank, checkCanonicalDualReadParity } from "../../lib/canonical";

export async function registerInternalCanonicalRoutes(app: FastifyInstance): Promise<void> {
  app.get("/internal/canonical/status", async () => {
    const [topics, maps, applicabilities, items] = await Promise.all([
      prisma.canonicalTopic.count(),
      prisma.syllabusTopicMap.count(),
      prisma.questionApplicability.count(),
      prisma.questionItem.count({ where: { canonicalTopicId: { not: null } } }),
    ]);
    return { topics, topicMaps: maps, applicabilities, questionsMapped: items };
  });

  /** Idempotent legacy backfill (§7). Safe to re-run. */
  app.post("/internal/canonical/backfill", async () => {
    const result = await backfillCanonicalBank();
    return { ok: true, ...result };
  });

  /**
   * Dual-read parity check (§7, Next item 3): run before dropping the legacy
   * sampling path for an exam. A non-empty `missingFromCanonical` means the
   * canonical mapping doesn't yet cover something the legacy path serves.
   */
  app.get("/internal/canonical/parity-check", async (request) => {
    const q = request.query as { examSlug?: string };
    const examSlug = String(q.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }
    return checkCanonicalDualReadParity(examSlug);
  });
}
