import type { FastifyInstance } from "fastify";
import {
  questionItemFingerprint,
  subjectSlug as toSubjectSlug,
  type DraftQuestionsRequest,
} from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { putObject } from "../../lib/storage";

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

  app.get("/internal/generation/planner-queue", async (request) => {
    const q = request.query as { limit?: string; target?: string; minKu?: string };
    const baseTarget = Math.max(1, Number(q.target || 20));
    const minKu = Math.max(1, Number(q.minKu || 4));
    const limit = Math.min(20, Number(q.limit || 3));

    const syllabi = await prisma.syllabus.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const scored: Array<Record<string, unknown> & { _rank: number }> = [];

    for (const syllabus of syllabi) {
      const leaves = await prisma.syllabusNode.findMany({
        where: { syllabusId: syllabus.id, depth: { gte: 1 } },
        orderBy: { ordinal: "asc" },
        take: 80,
      });

      const subjectTotals = new Map<string, number>();
      for (const leaf of leaves) {
        const subject = leaf.pathSlug.split("/")[0] || leaf.title;
        const pq = await prisma.previousQuestion.count({
          where: {
            OR: [{ syllabusNodeId: leaf.id }, { canonicalKey: leaf.canonicalKey }],
          },
        });
        subjectTotals.set(subject, (subjectTotals.get(subject) ?? 0) + pq);
      }

      for (const leaf of leaves) {
        const kuCount = await prisma.knowledgeUnit.count({
          where: { syllabusNodeId: leaf.id, status: "active" },
        });
        if (kuCount < minKu) continue;

        const previousQuestionCount = await prisma.previousQuestion.count({
          where: {
            OR: [{ syllabusNodeId: leaf.id }, { canonicalKey: leaf.canonicalKey }],
          },
        });

        const pathParts = leaf.pathSlug.split("/").map((p) => p.trim()).filter(Boolean);
        const subject = pathParts[0] || leaf.title;
        if (!subject.trim() || subject.trim().toLowerCase() === "geral") continue;

        const subjectTotal = Math.max(subjectTotals.get(subject) ?? 0, 1);
        const share = previousQuestionCount / subjectTotal;
        const subjectQuestionCount = leaf.questionCount ?? baseTarget;
        // §18.5 / §17.5: clamp(round(share × subject.questionCount × 4), 4, 40)
        const leafTarget = Math.max(
          4,
          Math.min(40, Math.round(share * subjectQuestionCount * 4) || baseTarget),
        );

        const [published, pending] = await Promise.all([
          prisma.questionItem.count({
            where: { syllabusNodeId: leaf.id, status: "published" },
          }),
          prisma.questionItem.count({
            where: { syllabusNodeId: leaf.id, status: { in: ["draft", "needs_review"] } },
          }),
        ]);
        const deficit = leafTarget - published - pending;
        if (deficit <= 0) continue;

        scored.push({
          examSlug: syllabus.examSlug,
          examTitle: null,
          syllabusNodeId: leaf.id,
          subject,
          pathSlug: leaf.pathSlug,
          canonicalKey: leaf.canonicalKey,
          rawText: leaf.rawText,
          path: pathParts.length > 0 ? pathParts : [subject],
          kuCount,
          published,
          pending,
          target: leafTarget,
          deficit,
          previousQuestionCount,
          _rank: previousQuestionCount * 3 + (leaf.questionCount ?? 0) + deficit,
        });
      }
    }

    scored.sort((a, b) => b._rank - a._rank);
    const items = scored.slice(0, limit).map(({ _rank: _ignored, ...rest }) => rest);
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
    const items = await prisma.questionItem.findMany({
      where: { syllabusNodeId: String(q.syllabusNodeId || "") || undefined },
      select: { prompt: true },
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

        const previousQuestionId =
          (qRec.previousQuestionId && String(qRec.previousQuestionId).trim()) ||
          (body.previousQuestionId && String(body.previousQuestionId).trim()) ||
          null;

        if (origin === "generation" && previousQuestionId) {
          throw Object.assign(
            new Error("previousQuestionId is reserved for transcription/OAB drafts (§30)"),
            { statusCode: 400 },
          );
        }

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
            previousQuestionId: origin === "generation" ? null : previousQuestionId,
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
