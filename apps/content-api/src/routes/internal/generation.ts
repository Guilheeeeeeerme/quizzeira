import type { FastifyInstance } from "fastify";
import {
  questionItemFingerprint,
  subjectSlug as toSubjectSlug,
  type DraftQuestionsRequest,
} from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { putObject } from "../../lib/storage";
import { isLeafPoisoned, type GenerationRunOutcome } from "../../lib/generation-fairness";

/** Consecutive recent failures before a leaf is skipped (§9). */
const POISON_THRESHOLD = 3;
/** Recent-run window per syllabus used to detect poisoned leaves. */
const POISON_LOOKBACK_RUNS = 300;

export async function registerInternalGenerationRoutes(app: FastifyInstance): Promise<void> {
  /** @deprecated Worker enqueues on discovery-api; kept for older callers. */
  app.post<{ Body: Record<string, unknown> }>("/internal/topic-queries", async (request) => {
    return {
      ok: true,
      queued: false,
      note: "post TopicQuery to discovery-api /internal/topic-queries",
      body: request.body,
    };
  });

  /**
   * Leaves ready for generation (§17.5 / §24): active KUs ≥ minKu and a
   * published+pending deficit against the leaf target. Per syllabus the
   * leaves are ranked by deficit (breadth first), syllabi are merged
   * round-robin in the order of `examSlugs` (caller passes open exams sorted
   * by registration deadline) so the soonest exam is always served first.
   * Stale `running` runs are reclaimed here so a worker restart never blocks
   * a leaf forever. Leaves whose last `POISON_THRESHOLD` runs all failed are
   * skipped (§9): a bad leaf's deficit never closes on its own, so without
   * this it would claim a slot on every single pass forever.
   */
  app.get("/internal/generation/planner-queue", async (request) => {
    const q = request.query as {
      limit?: string;
      target?: string;
      minKu?: string;
      examSlugs?: string;
    };
    const baseTarget = Math.max(1, Number(q.target || 20));
    const minKu = Math.max(1, Number(q.minKu || 4));
    const limit = Math.min(20, Number(q.limit || 3));
    const examSlugs = String(q.examSlugs || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    await prisma.generationRun.updateMany({
      where: { status: "running", startedAt: { lt: new Date(Date.now() - 20 * 60_000) } },
      data: { status: "failed", error: "stale: reclaimed by planner-queue", finishedAt: new Date() },
    });

    const syllabi = await prisma.syllabus.findMany({
      where: {
        status: "active",
        ...(examSlugs.length > 0 ? { examSlug: { in: examSlugs } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    if (examSlugs.length > 0) {
      const order = new Map(examSlugs.map((slug, i) => [slug, i]));
      syllabi.sort((a, b) => (order.get(a.examSlug) ?? 99) - (order.get(b.examSlug) ?? 99));
    }

    type LeafRow = {
      id: string;
      title: string;
      pathSlug: string;
      canonicalKey: string;
      rawText: string;
      questionCount: number | null;
      kuCount: bigint | number;
      published: bigint | number;
      pending: bigint | number;
      previousQuestionCount: bigint | number;
    };

    const perSyllabus: Array<Array<Record<string, unknown>>> = [];
    for (const syllabus of syllabi) {
      const rows = await prisma.$queryRaw<LeafRow[]>`
        select n.id, n.title, n."pathSlug", n."canonicalKey", n."rawText", n."questionCount",
               (select count(*) from "KnowledgeUnit" k where k.status = 'active' and k."syllabusNodeId" = n.id) as "kuCount",
               (select count(*) from "QuestionItem" q where q."syllabusNodeId" = n.id and q.status = 'published') as "published",
               (select count(*) from "QuestionItem" q where q."syllabusNodeId" = n.id and q.status in ('draft','needs_review')) as "pending",
               (select count(*) from "PreviousQuestion" p where p."syllabusNodeId" = n.id or p."canonicalKey" = n."canonicalKey") as "previousQuestionCount"
          from "SyllabusNode" n
         where n."syllabusId" = ${syllabus.id}
           and n.depth >= 1
           and n.status = 'active'
           and not exists (select 1 from "SyllabusNode" c where c."parentId" = n.id and c.status = 'active')
           and (select count(*) from "KnowledgeUnit" k where k.status = 'active' and k."syllabusNodeId" = n.id) >= ${minKu}
         order by "published" asc, "pending" asc, "previousQuestionCount" desc, n.ordinal asc
         limit ${Math.max(limit * 4, 20)}
      `;

      const subjectTotals = new Map<string, number>();
      for (const leaf of rows) {
        const subject = leaf.pathSlug.split("/")[0] || leaf.title;
        subjectTotals.set(subject, (subjectTotals.get(subject) ?? 0) + Number(leaf.previousQuestionCount));
      }

      const recentRuns = await prisma.generationRun.findMany({
        where: { syllabusNodeId: { in: rows.map((r) => r.id) } },
        orderBy: { startedAt: "desc" },
        take: POISON_LOOKBACK_RUNS,
        select: { syllabusNodeId: true, status: true },
      });
      const statusesByLeaf = new Map<string, GenerationRunOutcome[]>();
      for (const run of recentRuns) {
        if (!run.syllabusNodeId) continue;
        const list = statusesByLeaf.get(run.syllabusNodeId) ?? [];
        list.push(run.status);
        statusesByLeaf.set(run.syllabusNodeId, list);
      }

      const items: Array<Record<string, unknown>> = [];
      for (const leaf of rows) {
        const pathParts = leaf.pathSlug.split("/").map((x) => x.trim()).filter(Boolean);
        const subject = pathParts[0] || leaf.title;
        if (!subject.trim() || subject.trim().toLowerCase() === "geral") continue;
        if (isLeafPoisoned(statusesByLeaf.get(leaf.id) ?? [], POISON_THRESHOLD)) continue;
        const previousQuestionCount = Number(leaf.previousQuestionCount);
        const subjectTotal = Math.max(subjectTotals.get(subject) ?? 0, 1);
        const share = previousQuestionCount / subjectTotal;
        const subjectQuestionCount = leaf.questionCount ?? baseTarget;
        // §18.5 / §17.5: clamp(round(share × subject.questionCount × 4), 4, 40)
        const leafTarget = Math.max(
          4,
          Math.min(40, Math.round(share * subjectQuestionCount * 4) || baseTarget),
        );
        const published = Number(leaf.published);
        const pending = Number(leaf.pending);
        const deficit = leafTarget - published - pending;
        if (deficit <= 0) continue;
        items.push({
          examSlug: syllabus.examSlug,
          examTitle: null,
          syllabusNodeId: leaf.id,
          subject,
          pathSlug: leaf.pathSlug,
          canonicalKey: leaf.canonicalKey,
          rawText: leaf.rawText,
          path: pathParts.length > 0 ? pathParts : [subject],
          kuCount: Number(leaf.kuCount),
          published,
          pending,
          target: leafTarget,
          deficit,
          previousQuestionCount,
        });
      }
      if (items.length > 0) perSyllabus.push(items);
    }

    const items: Array<Record<string, unknown>> = [];
    for (let i = 0; items.length < limit; i += 1) {
      let any = false;
      for (const list of perSyllabus) {
        if (i < list.length) {
          any = true;
          items.push(list[i]!);
          if (items.length >= limit) break;
        }
      }
      if (!any) break;
    }
    return { items };
  });

  app.post<{ Body: Record<string, unknown> }>("/internal/generation/runs", async (request) => {
    const body = request.body ?? {};
    const syllabusNodeId = body.syllabusNodeId ? String(body.syllabusNodeId).trim() : "";
    if (!syllabusNodeId) {
      throw Object.assign(new Error("syllabusNodeId is required for generation runs"), {
        statusCode: 400,
      });
    }
    const subject = String(body.subject || "").trim();
    if (!subject || subject.toLowerCase() === "geral") {
      throw Object.assign(
        new Error("subject is required for generation runs (leaf path, not geral)"),
        { statusCode: 400 },
      );
    }
    const run = await prisma.generationRun.create({
      data: {
        examSlug: String(body.examSlug || ""),
        subject,
        syllabusNodeId,
        positionId: body.positionId ? String(body.positionId) : null,
        promptVersion: body.promptVersion ? String(body.promptVersion) : "generation.v2",
        status: "running",
        requested: Number(body.requested || 0),
        model: body.model ? String(body.model) : null,
        briefKey: body.briefKey ? String(body.briefKey) : null,
      },
    });
    return { run };
  });

  /** Store generation brief JSON and attach briefKey to the run (§35 / §30.2). */
  app.put<{
    Params: { id: string };
    Body: { brief: unknown };
  }>("/internal/generation/runs/:id/brief", async (request) => {
    const brief = request.body?.brief;
    if (!brief || typeof brief !== "object") {
      throw Object.assign(new Error("brief object required"), { statusCode: 400 });
    }
    const key = `briefs/${request.params.id}.json`;
    await putObject(key, JSON.stringify(brief));
    const run = await prisma.generationRun.update({
      where: { id: request.params.id },
      data: { briefKey: key },
    });
    return { run, briefKey: key };
  });

  app.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    "/internal/generation/runs/:id",
    async (request) => {
      const body = request.body ?? {};
      const run = await prisma.generationRun.update({
        where: { id: request.params.id },
        data: {
          status: (body.status as never) || undefined,
          drafted: body.drafted != null ? Number(body.drafted) : undefined,
          chunksUsed: body.chunksUsed != null ? Number(body.chunksUsed) : undefined,
          error: body.error ? String(body.error).slice(0, 500) : undefined,
          finishedAt: body.finishedAt ? new Date(String(body.finishedAt)) : undefined,
          briefKey: body.briefKey ? String(body.briefKey) : undefined,
        },
      });
      return { run };
    },
  );

  app.get("/internal/question-items/stems", async (request) => {
    const q = request.query as { syllabusNodeId?: string; limit?: string };
    // The generator must avoid what is (or may become) live on the leaf; the
    // most recent failed drafts are noise and used to crowd the list out.
    const items = await prisma.questionItem.findMany({
      where: {
        syllabusNodeId: String(q.syllabusNodeId || "") || undefined,
        status: { in: ["published", "needs_review", "draft"] },
      },
      select: { prompt: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: Math.min(50, Number(q.limit || 20)),
    });
    return { stems: items.map((i) => i.prompt) };
  });

  /**
   * The only way a QuestionItem enters the system, and it always lands as
   * `draft`. Content cannot publish — that is the Eval stage's decision.
   */
  app.post<{ Body: DraftQuestionsRequest & { generationRunId?: string } }>(
    "/internal/question-items/draft",
    async (request) => {
      const body = request.body;
      const examSlug = String(body?.examSlug || "").trim();
      if (!examSlug) {
        throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
      }
      const origin = (body.origin as string) || "generation";
      const subjectRaw = body.subject?.trim() || "";
      if (origin === "generation") {
        if (!subjectRaw || subjectRaw.toLowerCase() === "geral") {
          throw Object.assign(
            new Error("subject is required for generation drafts (leaf path, not geral)"),
            { statusCode: 400 },
          );
        }
      }
      const subject = subjectRaw || "geral";
      const slug = toSubjectSlug(subject);
      const bodySyllabus =
        "syllabusNodeId" in body && body.syllabusNodeId != null
          ? String(body.syllabusNodeId).trim()
          : "";
      const bodyKuIds =
        "knowledgeUnitIds" in body && Array.isArray(body.knowledgeUnitIds)
          ? (body.knowledgeUnitIds as string[]).map(String).filter((id) => id.trim())
          : null;

      if (origin === "generation") {
        if (!bodySyllabus) {
          throw Object.assign(new Error("syllabusNodeId is required for generation drafts"), {
            statusCode: 400,
          });
        }
      }

      const ids: string[] = [];
      let skipped = 0;

      for (const q of body.questions ?? []) {
        if (!q.prompt?.trim()) {
          skipped += 1;
          continue;
        }
        const fingerprint = questionItemFingerprint({
          examSlug,
          subjectSlug: slug,
          prompt: q.prompt,
          options: q.options,
        });
        const existing = await prisma.questionItem.findUnique({ where: { fingerprint } });
        if (existing) {
          skipped += 1;
          continue;
        }
        const qRec = q as {
          knowledgeUnitIds?: string[];
          syllabusNodeId?: string;
          passage?: string | null;
          distractorRationale?: string[];
          previousQuestionId?: string | null;
        };
        const qKuIds =
          Array.isArray(qRec.knowledgeUnitIds)
            ? qRec.knowledgeUnitIds.map(String).filter((id) => id.trim())
            : [];
        const knowledgeUnitIds = qKuIds.length > 0 ? qKuIds : (bodyKuIds ?? []);

        if (origin === "generation" && knowledgeUnitIds.length === 0) {
          skipped += 1;
          continue;
        }

        // §30: previousQuestionId is transcription/OAB provenance only — soft-strip
        // on every non-transcription path (generation, extraction, unknown).
        const previousQuestionId =
          origin === "transcription"
            ? (qRec.previousQuestionId && String(qRec.previousQuestionId).trim()) ||
              (body.previousQuestionId && String(body.previousQuestionId).trim()) ||
              null
            : null;

        const created = await prisma.questionItem.create({
          data: {
            fingerprint,
            examSlug,
            subject,
            subjectSlug: slug,
            emphasis: body.emphasis ?? null,
            origin: origin as never,
            status: "draft",
            type: q.type as never,
            prompt: q.prompt.trim(),
            options: q.type === "MULTIPLE_CHOICE" ? (q.options ?? []) : undefined,
            correctIndex: q.type === "MULTIPLE_CHOICE" ? q.correctIndex : null,
            referenceAnswer: q.type === "OPEN" ? q.referenceAnswer : null,
            explanation: q.explanation ?? null,
            locale: body.locale || "pt",
            documentId: body.documentId ?? null,
            generationRunId: body.generationRunId ?? null,
            syllabusNodeId: bodySyllabus || qRec.syllabusNodeId || null,
            knowledgeUnitIds,
            previousQuestionId,
            passage: qRec.passage ? String(qRec.passage).slice(0, 2000) : null,
            distractorRationale: Array.isArray(qRec.distractorRationale)
              ? qRec.distractorRationale
              : undefined,
          },
        });
        ids.push(created.id);
      }

      if (origin === "generation" && ids.length === 0 && (body.questions ?? []).length > 0) {
        throw Object.assign(new Error("knowledgeUnitIds are required for generation drafts"), {
          statusCode: 400,
        });
      }

      return { created: ids.length, skipped, ids };
    },
  );
}
