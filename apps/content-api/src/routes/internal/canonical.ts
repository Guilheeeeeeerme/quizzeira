import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { backfillCanonicalBank } from "../../lib/canonical";

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
}
