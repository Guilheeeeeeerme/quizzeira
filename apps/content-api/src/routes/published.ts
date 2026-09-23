// Concept: Question bank (published read API) + Sampling support
//
// The study API's only door into Content. Every query here is hard-filtered to
// status = published, so an un-evaluated draft can never reach a learner even
// if a caller asks for it.
import type { FastifyInstance, FastifyRequest } from "fastify";
import {
  subjectSlug as toSubjectSlug,
  type GeneratedQuestionInput,
  type PublishedSampleRequest,
} from "@quizzeira/shared";
import { env } from "../lib/env";
import { prisma } from "../lib/prisma";
import {
  buildStudyFocusOptions,
  nodeIdsForPosition,
} from "../lib/study-focus";

function assertReader(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.adminInternalKey && key !== env.internalApiKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

interface PublishedRow {
  id: string;
  type: "MULTIPLE_CHOICE" | "OPEN";
  prompt: string;
  options: unknown;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  origin?: string;
}

function toGeneratedQuestion(row: PublishedRow): GeneratedQuestionInput {
  return {
    type: row.type,
    prompt: row.prompt,
    options: row.type === "MULTIPLE_CHOICE" ? ((row.options as string[] | null) ?? []) : null,
    correctIndex: row.type === "MULTIPLE_CHOICE" ? row.correctIndex : null,
    referenceAnswer: row.type === "OPEN" ? row.referenceAnswer : null,
    explanation: row.explanation,
  };
}

/** Keep at most `cap` transcription-origin items; fill remainder with generation. */
function applyTranscriptionMixCap<T extends { origin?: string }>(rows: T[], cap: number): T[] {
  const transcriptions: T[] = [];
  const others: T[] = [];
  for (const row of rows) {
    if (row.origin === "transcription" || row.origin === "extraction") transcriptions.push(row);
    else others.push(row);
  }
  return [...others, ...transcriptions.slice(0, cap)];
}

export async function registerPublishedRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", async (request) => {
    if (request.url.startsWith("/published")) assertReader(request);
  });

  /**
   * Random sample of published questions. Ordering is done in Postgres so the
   * API never loads a whole exam into memory to pick five rows.
   */
  app.post<{
    Body: PublishedSampleRequest & {
      syllabusNodeIds?: string[];
      positionId?: string | null;
    };
  }>("/published/sample", async (request) => {
    const body = request.body;
    const examSlug = String(body?.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }
    const limit = Math.max(1, Math.min(Number(body.limit || 5), 40));
    const exclude = body.excludeIds ?? [];
    const subjectSlugs = (body.subjects ?? [])
      .map((s) => toSubjectSlug(s))
      .filter((s) => s && s !== "geral");
    let leafIds = (body.syllabusNodeIds ?? []).filter(Boolean);
    const positionId = body.positionId?.trim() || null;
    let matchedRealPosition = false;

    // Expand edital area → syllabus nodes when positionId is a real Position id.
    // Cargo-as-area fallbacks use a subject slug as positionId — treat as subject filter.
    if (positionId && leafIds.length === 0) {
      const syllabus = await prisma.syllabus.findFirst({
        where: { examSlug, status: "active" },
        orderBy: { version: "desc" },
        include: {
          positions: { select: { id: true } },
          nodes: { select: { id: true, positionIds: true } },
        },
      });
      matchedRealPosition = Boolean(syllabus?.positions.some((p) => p.id === positionId));
      if (matchedRealPosition && syllabus) {
        leafIds = nodeIdsForPosition(syllabus.nodes, positionId);
      } else if (subjectSlugs.length === 0) {
        // Cargo-as-area: bank rows are tagged with that cargo as subjectSlug.
        subjectSlugs.push(toSubjectSlug(positionId));
      }
    }

    const base = {
      status: "published" as const,
      examSlug,
      ...(body.locale ? { locale: body.locale } : {}),
      ...(exclude.length > 0 ? { id: { notIn: exclude } } : {}),
      ...(leafIds.length > 0 ? { syllabusNodeId: { in: leafIds } } : {}),
      ...(matchedRealPosition && leafIds.length === 0 ? { positionId } : {}),
    };

    // Cap transcriptions at 30% of the sample (§18.6) except pure-OAB consumers.
    const transcriptionCap = Math.max(0, Math.floor(limit * 0.3));
    let rows = subjectSlugs.length
      ? await sampleRows({ ...base, subjectSlug: { in: subjectSlugs } }, limit)
      : await sampleRows(base, limit);
    if (rows.length < limit && leafIds.length === 0) {
      const more = await sampleRows(
        { ...base, ...(rows.length ? { id: { notIn: [...exclude, ...rows.map((r) => r.id)] } } : {}) },
        limit - rows.length,
      );
      rows = [...rows, ...more];
    }

    // Dual-read (§12 canonical bank): fill remaining slots through active
    // applicability mappings — a question published under one mapping serves
    // any compatible syllabus node, exam-independent.
    if (rows.length < limit) {
      const seen = new Set([...exclude, ...rows.map((r) => r.id)]);
      const applicabilityWhere = {
        status: "published" as const,
        applicabilities: {
          some: {
            state: "active",
            OR: [{ validThrough: null }, { validThrough: { gt: new Date() } }],
            ...(leafIds.length > 0
              ? { syllabusNodeId: { in: leafIds } }
              : { syllabusNode: { syllabus: { examSlug, status: "active" } } }),
          },
        },
        ...(rows.length ? { id: { notIn: [...exclude, ...rows.map((r) => r.id)] } } : {}),
      };
      const mapped = await sampleRows(applicabilityWhere, limit - rows.length);
      for (const row of mapped) {
        if (rows.length >= limit) break;
        if (seen.has(row.id)) continue;
        seen.add(row.id);
        rows.push(row);
      }
    }

    rows = applyTranscriptionMixCap(rows, transcriptionCap);

    return {
      questions: rows.map(toGeneratedQuestion),
      ids: rows.map((r) => r.id),
      hitCount: rows.length,
    };
  });

  /** Active syllabus + bank-backed focus options for study (§47). */
  app.get<{ Params: { slug: string } }>("/published/exams/:slug/syllabus", async (request) => {
    const examSlug = request.params.slug.trim();
    const syllabus = await prisma.syllabus.findFirst({
      where: { examSlug, status: "active" },
      orderBy: { version: "desc" },
      include: {
        positions: true,
        nodes: { orderBy: [{ depth: "asc" }, { ordinal: "asc" }] },
      },
    });
    if (!syllabus) {
      return {
        examSlug,
        syllabus: null,
        nodes: [],
        positions: [],
        focusAreas: [],
        focusSubjects: [],
      };
    }

    const [byNode, bySubject, byPosition] = await Promise.all([
      prisma.questionItem.groupBy({
        by: ["syllabusNodeId"],
        where: { examSlug, status: "published", syllabusNodeId: { not: null } },
        _count: { _all: true },
      }),
      prisma.questionItem.groupBy({
        by: ["subjectSlug", "subject"],
        where: { examSlug, status: "published", NOT: { subjectSlug: "geral" } },
        _count: { _all: true },
      }),
      prisma.questionItem.groupBy({
        by: ["positionId"],
        where: { examSlug, status: "published", positionId: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const { focusAreas, focusSubjects } = buildStudyFocusOptions({
      positions: syllabus.positions,
      nodes: syllabus.nodes,
      publishedByNodeId: new Map(
        byNode
          .filter((r) => r.syllabusNodeId)
          .map((r) => [r.syllabusNodeId as string, r._count._all]),
      ),
      publishedBySubject: bySubject.map((r) => ({
        subjectSlug: r.subjectSlug,
        subject: r.subject,
        count: r._count._all,
      })),
      publishedByPositionId: new Map(
        byPosition
          .filter((r) => r.positionId)
          .map((r) => [r.positionId as string, r._count._all]),
      ),
    });

    return {
      examSlug,
      syllabus: {
        id: syllabus.id,
        version: syllabus.version,
        status: syllabus.status,
        sourceDocumentId: syllabus.sourceDocumentId,
      },
      positions: syllabus.positions.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        implicit: p.implicit,
      })),
      nodes: syllabus.nodes.map((n) => ({
        id: n.id,
        parentId: n.parentId,
        depth: n.depth,
        ordinal: n.ordinal,
        title: n.title,
        pathSlug: n.pathSlug,
        canonicalKey: n.canonicalKey,
        scope: n.scope,
        canonicalSubjectId: n.canonicalSubjectId,
        positionIds: n.positionIds,
      })),
      focusAreas,
      focusSubjects,
    };
  });

  app.get("/published/stats", async (request) => {
    const q = request.query as { examSlug?: string };
    const where = q.examSlug?.trim() ? { examSlug: q.examSlug.trim() } : {};
    const grouped = await prisma.questionItem.groupBy({
      by: ["examSlug", "status"],
      where,
      _count: { _all: true },
    });

    const byExam = new Map<
      string,
      { examSlug: string; draft: number; needsReview: number; published: number; failed: number }
    >();
    for (const row of grouped) {
      const entry =
        byExam.get(row.examSlug) ??
        { examSlug: row.examSlug, draft: 0, needsReview: 0, published: 0, failed: 0 };
      const count = row._count._all;
      if (row.status === "draft") entry.draft += count;
      else if (row.status === "needs_review") entry.needsReview += count;
      else if (row.status === "published") entry.published += count;
      else if (row.status === "failed") entry.failed += count;
      byExam.set(row.examSlug, entry);
    }

    return { exams: [...byExam.values()].sort((a, b) => b.published - a.published) };
  });

  /** Study fetches a specific published question (e.g. to rebuild an attempt). */
  app.get<{ Params: { id: string } }>("/published/items/:id", async (request) => {
    const item = await prisma.questionItem.findFirst({
      where: { id: request.params.id, status: "published" },
    });
    if (!item) throw Object.assign(new Error("not found"), { statusCode: 404 });
    return { question: toGeneratedQuestion(item as PublishedRow), id: item.id };
  });
}

async function sampleRows(
  where: Record<string, unknown>,
  limit: number,
): Promise<Array<PublishedRow & { id: string }>> {
  if (limit <= 0) return [];
  // Cheap randomization: take a bounded window ordered by a random-ish column
  // and shuffle in the app. ORDER BY random() over a large table is the thing
  // we are avoiding here.
  const window = await prisma.questionItem.findMany({
    where: where as never,
    select: {
      id: true,
      type: true,
      prompt: true,
      options: true,
      correctIndex: true,
      referenceAnswer: true,
      explanation: true,
      origin: true,
    },
    orderBy: { publishedAt: "desc" },
    take: Math.min(200, limit * 10),
  });
  return shuffle(window).slice(0, limit) as Array<PublishedRow & { id: string }>;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
