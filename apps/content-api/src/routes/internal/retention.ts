// Concept: Retention — raw artifact bytes are only needed until a document has
// been normalized (or has definitively failed). After a grace period the bytes
// are deleted from object storage; the normalized text JSON and every derived
// row stay, and a later reprocess re-fetches `sourceUrl`.
import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { deleteObject } from "../../lib/storage";

const DEFAULT_GRACE_DAYS = 7;
const MAX_BATCH = 500;

export async function registerInternalRetentionRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Purge stored bytes of terminal documents older than `olderThanDays`.
   * Storage keys are content-addressed and shared across exams, so a key is
   * only deleted when EVERY document holding it is terminal and past grace.
   */
  app.post<{ Body: { olderThanDays?: number; limit?: number; dryRun?: boolean } }>(
    "/internal/retention/purge-artifacts",
    async (request) => {
      const body = request.body ?? {};
      const graceDays = Math.max(1, Number(body.olderThanDays ?? DEFAULT_GRACE_DAYS));
      const limit = Math.min(MAX_BATCH, Math.max(1, Number(body.limit ?? 200)));
      const dryRun = Boolean(body.dryRun);
      const cutoff = new Date(Date.now() - graceDays * 86_400_000);

      const candidates = await prisma.document.findMany({
        where: {
          storageKey: { not: null },
          bytesPurgedAt: null,
          status: { in: ["extracted", "failed"] },
          updatedAt: { lt: cutoff },
        },
        orderBy: { updatedAt: "asc" },
        take: limit,
        select: { id: true, storageKey: true, discoveryArtifactId: true },
      });
      const keys = Array.from(new Set(candidates.map((c) => c.storageKey!)));
      if (keys.length === 0) return { purged: [], skipped: 0, dryRun };

      // A twin still pending/extracting (or too young) keeps the bytes alive.
      const holders = await prisma.document.findMany({
        where: { storageKey: { in: keys } },
        select: {
          id: true,
          storageKey: true,
          status: true,
          updatedAt: true,
          bytesPurgedAt: true,
          discoveryArtifactId: true,
        },
      });
      const byKey = new Map<string, typeof holders>();
      for (const h of holders) {
        const list = byKey.get(h.storageKey!) ?? [];
        list.push(h);
        byKey.set(h.storageKey!, list);
      }

      const purged: Array<{ storageKey: string; documentIds: string[]; artifactIds: string[] }> = [];
      let skipped = 0;
      for (const key of keys) {
        const docs = byKey.get(key) ?? [];
        const blocked = docs.some(
          (d) =>
            !(d.status === "extracted" || d.status === "failed") ||
            d.updatedAt >= cutoff,
        );
        if (blocked) {
          skipped += 1;
          continue;
        }
        if (!dryRun) {
          await deleteObject(key);
          await prisma.document.updateMany({
            where: { storageKey: key, bytesPurgedAt: null },
            data: { bytesPurgedAt: new Date() },
          });
        }
        purged.push({
          storageKey: key,
          documentIds: docs.map((d) => d.id),
          artifactIds: docs
            .map((d) => d.discoveryArtifactId)
            .filter((id): id is string => Boolean(id)),
        });
      }
      return { purged, skipped, dryRun, graceDays };
    },
  );

  /** What retention would touch next, plus how much is already reclaimed. */
  app.get("/internal/retention/status", async () => {
    const [stored, purged] = await Promise.all([
      prisma.document.count({ where: { storageKey: { not: null }, bytesPurgedAt: null } }),
      prisma.document.count({ where: { bytesPurgedAt: { not: null } } }),
    ]);
    return { documentsWithBytes: stored, documentsPurged: purged };
  });
}
