// Concept: Triage — the recurring maintenance loop over the document pile.
//
// Two jobs, both driven by content-worker's `triage` pass:
//   * uncertain: documents the classifier could not place (unknown / low
//     confidence) get re-tried by the LLM a bounded number of times; what is
//     still unknown afterwards is the human's (admin files panel).
//   * prune: documents that are clearly useless for generation lose their
//     bytes + sections/chunks right away. A stub row stays so the admin panel
//     still shows the file and why it was dropped.
import type { FastifyInstance } from "fastify";
import { Prisma } from "../../generated/prisma";
import { prisma } from "../../lib/prisma";
import { deleteObject } from "../../lib/storage";

const ADMIN_ROLE_METHOD = "admin_override";
const LOW_CONFIDENCE = 0.55;
/** Files younger than this are left alone — the process pass may still act. */
const PRUNE_MIN_AGE_DAYS = 2;
/** Fail reasons that never resolve on retry. */
const TERMINAL_FAIL = /^(too_short|duplicate_document:|skipped: vlibras|unsupported_format|fetch 40[34]\b|fetch 410\b)/;

export type PruneReason = "administrative" | "terminal_failure" | "no_usable_content";

export async function registerInternalTriageRoutes(app: FastifyInstance): Promise<void> {
  /**
   * Extracted documents with no decisive role and no human label, oldest first.
   * The worker applies the attempt/backoff bookkeeping (kept in outcome.triage).
   */
  app.get("/internal/triage/uncertain", async (request) => {
    const q = request.query as { limit?: string };
    const items = await prisma.document.findMany({
      where: {
        status: "extracted",
        normalizedKey: { not: null },
        OR: [{ role: "unknown" }, { roleConfidence: { lt: LOW_CONFIDENCE } }],
        NOT: [{ roleMethod: ADMIN_ROLE_METHOD }, { failReason: { startsWith: "pruned:" } }],
      },
      orderBy: { updatedAt: "asc" },
      take: Math.min(100, Number(q.limit || 20)),
      select: {
        id: true,
        examSlug: true,
        examTitle: true,
        kind: true,
        role: true,
        roleConfidence: true,
        roleMethod: true,
        outcome: true,
        sourceUrl: true,
        contentHash: true,
      },
    });
    return { items };
  });

  /**
   * Drop bytes + derived rows of clearly useless documents. Never touches
   * hand-labelled files, specification/evidence/mixed/unknown roles, or any
   * document a question, previous question or knowledge unit points at.
   */
  app.post<{ Body: { limit?: number; dryRun?: boolean } }>(
    "/internal/triage/prune",
    async (request) => {
      const body = request.body ?? {};
      const limit = Math.min(500, Math.max(1, Number(body.limit ?? 100)));
      const dryRun = Boolean(body.dryRun);
      const cutoff = new Date(Date.now() - PRUNE_MIN_AGE_DAYS * 86_400_000);

      const rows = await prisma.$queryRaw<
        Array<{ id: string; storageKey: string | null; discoveryArtifactId: string | null; reason: PruneReason; failReason: string | null }>
      >(Prisma.sql`
        WITH candidates AS (
          SELECT d.id, d."storageKey", d."discoveryArtifactId", d."failReason",
            CASE
              WHEN d.role = 'administrative' AND d.status = 'extracted' THEN 'administrative'
              WHEN d.status = 'failed' AND d."failReason" ~ ${TERMINAL_FAIL.source} THEN 'terminal_failure'
              WHEN d.role = 'knowledge' AND d.status = 'extracted'
                AND NOT EXISTS (
                  SELECT 1 FROM "Chunk" c WHERE c."documentId" = d.id
                    AND c.eligibility IN ('eligible', 'parked'))
                THEN 'no_usable_content'
            END AS reason
          FROM "Document" d
          WHERE d."updatedAt" < ${cutoff}
            AND COALESCE(d."roleMethod", '') <> ${ADMIN_ROLE_METHOD}
            AND COALESCE(d."failReason", '') NOT LIKE 'pruned:%'
            AND (d."bytesPurgedAt" IS NULL OR EXISTS (SELECT 1 FROM "Section" s WHERE s."documentId" = d.id))
            AND NOT EXISTS (SELECT 1 FROM "QuestionItem" q WHERE q."documentId" = d.id)
            AND NOT EXISTS (SELECT 1 FROM "PreviousQuestion" p WHERE p."documentId" = d.id)
            AND NOT EXISTS (SELECT 1 FROM "Syllabus" sy WHERE sy."sourceDocumentId" = d.id)
        )
        SELECT id, "storageKey", "discoveryArtifactId", reason, "failReason"
        FROM candidates
        WHERE reason IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "KnowledgeUnit" ku, jsonb_array_elements(ku.evidence) e
            WHERE e->>'documentId' = candidates.id)
        ORDER BY id
        LIMIT ${limit}`);

      if (rows.length === 0) return { pruned: [], dryRun };

      // Content-addressed keys can be shared; only delete an object when no
      // live (non-pruned, non-terminal) document still needs it.
      const keys = Array.from(new Set(rows.map((r) => r.storageKey).filter((k): k is string => Boolean(k))));
      const prunedIds = new Set(rows.map((r) => r.id));
      const holders = keys.length
        ? await prisma.document.findMany({
            where: { storageKey: { in: keys } },
            select: { id: true, storageKey: true, status: true, bytesPurgedAt: true },
          })
        : [];
      const keyBlocked = new Set<string>();
      for (const h of holders) {
        if (prunedIds.has(h.id) || h.bytesPurgedAt) continue;
        if (h.status === "pending" || h.status === "extracting") keyBlocked.add(h.storageKey!);
      }

      const pruned: Array<{ id: string; reason: PruneReason; artifactId: string | null; bytesDeleted: boolean }> = [];
      const now = new Date();
      for (const row of rows) {
        const deleteBytes = Boolean(row.storageKey) && !keyBlocked.has(row.storageKey!);
        if (!dryRun) {
          if (deleteBytes) await deleteObject(row.storageKey!);
          await prisma.$transaction([
            // Cascade removes chunks (and their embeddings) with the sections.
            prisma.section.deleteMany({ where: { documentId: row.id } }),
            prisma.chunk.deleteMany({ where: { documentId: row.id } }),
            // Merge, don't replace: the process pass outcome explains what the
            // file was before it got pruned.
            prisma.$executeRaw(Prisma.sql`
              UPDATE "Document"
              SET "failReason" = ${`pruned:${row.reason}`},
                  "bytesPurgedAt" = CASE WHEN ${deleteBytes} THEN ${now} ELSE "bytesPurgedAt" END,
                  outcome = COALESCE(outcome, '{}'::jsonb) || jsonb_build_object('pruned', ${JSON.stringify({
                    reason: row.reason,
                    at: now.toISOString(),
                    originalFailReason: row.failReason,
                  })}::jsonb),
                  "updatedAt" = ${now}
              WHERE id = ${row.id}`),
          ]);
          if (deleteBytes && row.storageKey) {
            await prisma.document.updateMany({
              where: { storageKey: row.storageKey, bytesPurgedAt: null },
              data: { bytesPurgedAt: now },
            });
          }
        }
        pruned.push({ id: row.id, reason: row.reason, artifactId: row.discoveryArtifactId, bytesDeleted: deleteBytes });
      }
      return { pruned, dryRun };
    },
  );
}
