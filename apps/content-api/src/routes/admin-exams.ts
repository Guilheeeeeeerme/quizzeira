// Concept: Admin exam triage — the per-exam file funnel (Artifact → Document →
// syllabus / evidence / KUs → questions) and the role override that lets a human
// re-label a file the classifier got wrong.
//
// Reached through the study API's /admin/content/* proxy; the study API joins
// these rows with Discovery's artifacts by `discoveryArtifactId`.
import type { FastifyInstance } from "fastify";
import { Prisma } from "../generated/prisma";
import { prisma } from "../lib/prisma";

const DOCUMENT_ROLES = new Set([
  "specification",
  "evidence",
  "knowledge",
  "administrative",
  "mixed",
  "unknown",
]);
const DOCUMENT_KINDS = new Set(["edital", "prova", "gabarito", "programa", "other"]);

/** roleMethod written by PATCH /admin/documents/:id; the worker honours it over
 * every classifier tier (see content-worker process stage). */
export const ADMIN_ROLE_METHOD = "admin_override";

interface ExamPipelineSummary {
  documents: number;
  extracted: number;
  failed: number;
  pending: number;
  unknownRole: number;
  lowConfidence: number;
  byRole: Record<string, number>;
  syllabus: { status: string; nodes: number } | null;
  previousQuestions: number;
  knowledgeUnits: number;
  items: { published: number; needsReview: number; draft: number; failed: number };
  lastGeneration: { status: string; error: string | null; at: string } | null;
}

function emptySummary(): ExamPipelineSummary {
  return {
    documents: 0,
    extracted: 0,
    failed: 0,
    pending: 0,
    unknownRole: 0,
    lowConfidence: 0,
    byRole: {},
    syllabus: null,
    previousQuestions: 0,
    knowledgeUnits: 0,
    items: { published: 0, needsReview: 0, draft: 0, failed: 0 },
    lastGeneration: null,
  };
}

export async function registerAdminExamRoutes(app: FastifyInstance): Promise<void> {
  /**
   * One row per examSlug with the whole funnel collapsed into counts. The
   * exams list page merges this into Discovery's exam rows so "400 files,
   * 0 questions" is explained on the card instead of hidden behind a click.
   */
  app.get("/admin/exams/summary", async () => {
    const [docs, roles, lowConf, syllabi, prevQ, items, runs] = await Promise.all([
      prisma.document.groupBy({ by: ["examSlug", "status"], _count: { _all: true } }),
      prisma.document.groupBy({ by: ["examSlug", "role"], _count: { _all: true } }),
      prisma.document.groupBy({
        by: ["examSlug"],
        where: { role: { not: "unknown" }, roleConfidence: { lt: 0.55 } },
        _count: { _all: true },
      }),
      prisma.syllabus.findMany({
        where: { status: { in: ["active", "needs_review"] } },
        orderBy: [{ status: "asc" }, { version: "desc" }],
        select: { examSlug: true, status: true, _count: { select: { nodes: true } } },
      }),
      prisma.$queryRaw<Array<{ examSlug: string; n: bigint }>>(Prisma.sql`
        SELECT d."examSlug" AS "examSlug", COUNT(*)::bigint AS n
        FROM "PreviousQuestion" p JOIN "Document" d ON d.id = p."documentId"
        GROUP BY d."examSlug"`),
      prisma.questionItem.groupBy({ by: ["examSlug", "status"], _count: { _all: true } }),
      prisma.$queryRaw<
        Array<{ examSlug: string; status: string; error: string | null; startedAt: Date }>
      >(Prisma.sql`
        SELECT DISTINCT ON ("examSlug") "examSlug", status::text AS status, error, "startedAt"
        FROM "GenerationRun" ORDER BY "examSlug", "startedAt" DESC`),
    ]);

    const out = new Map<string, ExamPipelineSummary>();
    const get = (slug: string) => {
      let s = out.get(slug);
      if (!s) {
        s = emptySummary();
        out.set(slug, s);
      }
      return s;
    };
    for (const d of docs) {
      const s = get(d.examSlug);
      s.documents += d._count._all;
      if (d.status === "extracted") s.extracted += d._count._all;
      else if (d.status === "failed") s.failed += d._count._all;
      else s.pending += d._count._all;
    }
    for (const r of roles) {
      const s = get(r.examSlug);
      s.byRole[r.role] = r._count._all;
      if (r.role === "unknown") s.unknownRole += r._count._all;
    }
    for (const l of lowConf) get(l.examSlug).lowConfidence = l._count._all;
    // "active" sorts before "needs_review"; first hit per slug wins.
    for (const sy of syllabi) {
      const s = get(sy.examSlug);
      if (!s.syllabus) s.syllabus = { status: sy.status, nodes: sy._count.nodes };
    }
    for (const p of prevQ) get(p.examSlug).previousQuestions = Number(p.n);
    for (const it of items) {
      const s = get(it.examSlug);
      if (it.status === "published") s.items.published += it._count._all;
      else if (it.status === "needs_review") s.items.needsReview += it._count._all;
      else if (it.status === "failed") s.items.failed += it._count._all;
      else s.items.draft += it._count._all;
    }
    for (const r of runs) {
      get(r.examSlug).lastGeneration = {
        status: r.status,
        error: r.error,
        at: r.startedAt.toISOString(),
      };
    }
    // KnowledgeUnit has no examSlug; count through the syllabus node.
    const kus = await prisma.$queryRaw<Array<{ examSlug: string; n: bigint }>>(Prisma.sql`
      SELECT s."examSlug" AS "examSlug", COUNT(ku.id)::bigint AS n
      FROM "KnowledgeUnit" ku
      JOIN "SyllabusNode" sn ON sn.id = ku."syllabusNodeId"
      JOIN "Syllabus" s ON s.id = sn."syllabusId"
      WHERE ku.status = 'active'
      GROUP BY s."examSlug"`);
    for (const k of kus) get(k.examSlug).knowledgeUnits = Number(k.n);

    return { items: Object.fromEntries(out) };
  });

  /**
   * Every document of one exam with what the pipeline did to it. Counts are
   * fetched in bulk (groupBy) rather than per row — an exam can have 400 files.
   */
  app.get<{ Params: { examSlug: string } }>(
    "/admin/exams/:examSlug/documents",
    async (request) => {
      const examSlug = request.params.examSlug;
      const q = request.query as { limit?: string };
      const documents = await prisma.document.findMany({
        where: { examSlug },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        take: Math.min(1000, Number(q.limit || 500)),
        include: { _count: { select: { sections: true, previousQuestions: true } } },
      });
      const ids = documents.map((d) => d.id);
      const [chunks, items, kus] = await Promise.all([
        prisma.chunk.groupBy({
          by: ["documentId", "eligibility"],
          where: { documentId: { in: ids } },
          _count: { _all: true },
        }),
        prisma.questionItem.groupBy({
          by: ["documentId", "status"],
          where: { documentId: { in: ids } },
          _count: { _all: true },
        }),
        ids.length
          ? prisma.$queryRaw<Array<{ documentId: string; n: bigint }>>(Prisma.sql`
              SELECT e->>'documentId' AS "documentId", COUNT(*)::bigint AS n
              FROM "KnowledgeUnit" ku, jsonb_array_elements(ku.evidence) e
              WHERE ku.status = 'active' AND e->>'documentId' IN (${Prisma.join(ids)})
              GROUP BY 1`)
          : Promise.resolve([]),
      ]);
      const chunkBy = new Map<string, Record<string, number>>();
      for (const c of chunks) {
        const rec = chunkBy.get(c.documentId) ?? {};
        rec[c.eligibility] = c._count._all;
        chunkBy.set(c.documentId, rec);
      }
      const itemBy = new Map<string, Record<string, number>>();
      for (const it of items) {
        if (!it.documentId) continue;
        const rec = itemBy.get(it.documentId) ?? {};
        rec[it.status] = it._count._all;
        itemBy.set(it.documentId, rec);
      }
      const kuBy = new Map(kus.map((k) => [k.documentId, Number(k.n)]));

      return {
        items: documents.map((d) => ({
          id: d.id,
          discoveryArtifactId: d.discoveryArtifactId,
          examSlug: d.examSlug,
          kind: d.kind,
          role: d.role,
          roleConfidence: d.roleConfidence,
          roleMethod: d.roleMethod,
          subtype: d.subtype,
          status: d.status,
          failReason: d.failReason,
          attempts: d.attempts,
          outcome: d.outcome,
          sourceUrl: d.sourceUrl,
          contentType: d.contentType,
          storageKey: d.storageKey,
          bytesPurgedAt: d.bytesPurgedAt?.toISOString() ?? null,
          nearDuplicateOfId: d.nearDuplicateOfId,
          language: d.language,
          stats: d.stats,
          sectionCount: d._count.sections,
          previousQuestions: d._count.previousQuestions,
          chunks: chunkBy.get(d.id) ?? {},
          knowledgeUnits: kuBy.get(d.id) ?? 0,
          items: itemBy.get(d.id) ?? {},
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        })),
      };
    },
  );

  /**
   * Human re-label. Sets the role/kind with method `admin_override` so the
   * worker's classifier ladder leaves it alone, and (by default) requeues the
   * document so syllabus / evidence / knowledge stages run under the new role.
   */
  app.patch<{ Params: { id: string }; Body: { role?: string; kind?: string; reprocess?: boolean } }>(
    "/admin/documents/:id",
    async (request) => {
      const body = request.body ?? {};
      if (body.role !== undefined && !DOCUMENT_ROLES.has(body.role)) {
        throw Object.assign(new Error("invalid role"), { statusCode: 400 });
      }
      if (body.kind !== undefined && !DOCUMENT_KINDS.has(body.kind)) {
        throw Object.assign(new Error("invalid kind"), { statusCode: 400 });
      }
      if (body.role === undefined && body.kind === undefined && !body.reprocess) {
        throw Object.assign(new Error("nothing to change"), { statusCode: 400 });
      }
      const existing = await prisma.document.findUnique({ where: { id: request.params.id } });
      if (!existing) throw Object.assign(new Error("not found"), { statusCode: 404 });
      const reprocess = body.reprocess !== false;
      const document = await prisma.document.update({
        where: { id: existing.id },
        data: {
          ...(body.role !== undefined
            ? { role: body.role as never, roleConfidence: 1, roleMethod: ADMIN_ROLE_METHOD }
            : {}),
          ...(body.kind !== undefined ? { kind: body.kind as never } : {}),
          ...(reprocess
            ? {
                status: "pending",
                attempts: 0,
                failReason: null,
                outcome: Prisma.DbNull,
                // A twin marked duplicate is a classifier verdict too; an
                // explicit re-label must be allowed to reprocess it.
                nearDuplicateOfId: null,
              }
            : {}),
        },
      });
      return { document: { id: document.id, role: document.role, kind: document.kind, status: document.status } };
    },
  );
}
