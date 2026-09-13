import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import { getJsonObject } from "../../lib/storage";
import { fetchArtifactProvenance } from "../../lib/discovery-client";

async function syllabusPath(
  nodeId: string | null | undefined,
): Promise<Array<{ id: string; title: string; pathSlug: string; parentId: string | null }>> {
  if (!nodeId) return [];
  const path: Array<{ id: string; title: string; pathSlug: string; parentId: string | null }> = [];
  let currentId: string | null = nodeId;
  for (let i = 0; i < 32 && currentId; i += 1) {
    const node: { id: string; title: string; pathSlug: string; parentId: string | null } | null =
      await prisma.syllabusNode.findUnique({
        where: { id: currentId },
        select: { id: true, title: true, pathSlug: true, parentId: true },
      });
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }
  return path;
}

function evidenceSpan(ev: Record<string, unknown>): [number, number] | null {
  if (Array.isArray(ev.span) && ev.span.length === 2) {
    return [Number(ev.span[0]), Number(ev.span[1])];
  }
  return null;
}

export async function registerInternalProvenanceRoutes(app: FastifyInstance): Promise<void> {
  /** Full provenance tree for a question item (§30.2). */
  app.get<{ Params: { id: string } }>(
    "/internal/question-items/:id/provenance",
    async (request) => {
      const item = await prisma.questionItem.findUnique({
        where: { id: request.params.id },
        include: {
          document: true,
          generationRun: true,
          reviews: { orderBy: { createdAt: "desc" }, take: 20 },
        },
      });
      if (!item) {
        throw Object.assign(new Error("not found"), { statusCode: 404 });
      }

      const kuIds = Array.isArray(item.knowledgeUnitIds)
        ? (item.knowledgeUnitIds as string[])
        : [];
      const knowledgeUnits =
        kuIds.length > 0
          ? await prisma.knowledgeUnit.findMany({ where: { id: { in: kuIds } } })
          : [];

      const evidenceDocIds = new Set<string>();
      const evidenceChunkIds = new Set<string>();
      const evidenceOrdinalsByDoc = new Map<string, number[]>();
      for (const ku of knowledgeUnits) {
        const evidence = Array.isArray(ku.evidence)
          ? (ku.evidence as Array<Record<string, unknown>>)
          : [];
        for (const ev of evidence) {
          if (ev.documentId) evidenceDocIds.add(String(ev.documentId));
          if (ev.chunkId) evidenceChunkIds.add(String(ev.chunkId));
          if (ev.documentId != null && ev.chunkOrdinal != null) {
            const docId = String(ev.documentId);
            const list = evidenceOrdinalsByDoc.get(docId) ?? [];
            list.push(Number(ev.chunkOrdinal));
            evidenceOrdinalsByDoc.set(docId, list);
          }
        }
      }

      const ordinalChunkQueries = [...evidenceOrdinalsByDoc.entries()].flatMap(
        ([documentId, ordinals]) =>
          ordinals.map((ordinal) =>
            prisma.chunk.findFirst({
              where: { documentId, ordinal },
              include: { section: true, document: true },
            }),
          ),
      );

      const [evidenceChunksById, evidenceChunksByOrdinal, evidenceDocuments] = await Promise.all([
        evidenceChunkIds.size > 0
          ? prisma.chunk.findMany({
              where: { id: { in: [...evidenceChunkIds] } },
              include: { section: true, document: true },
            })
          : Promise.resolve([]),
        Promise.all(ordinalChunkQueries).then((rows) => rows.filter(Boolean)),
        evidenceDocIds.size > 0
          ? prisma.document.findMany({ where: { id: { in: [...evidenceDocIds] } } })
          : Promise.resolve([]),
      ]);

      const evidenceChunks = [
        ...evidenceChunksById,
        ...evidenceChunksByOrdinal.filter(
          (c): c is NonNullable<typeof c> =>
            c != null && !evidenceChunksById.some((x) => x.id === c.id),
        ),
      ];

      const syllabusNode = item.syllabusNodeId
        ? await prisma.syllabusNode.findUnique({
            where: { id: item.syllabusNodeId },
            include: { syllabus: true },
          })
        : null;

      const specificationDocument = syllabusNode?.syllabus.sourceDocumentId
        ? await prisma.document.findUnique({
            where: { id: syllabusNode.syllabus.sourceDocumentId },
          })
        : null;

      const syllabusAncestors = await syllabusPath(item.syllabusNodeId);

      let brief: unknown = null;
      if (item.generationRun?.briefKey) {
        brief = await getJsonObject(item.generationRun.briefKey).catch(() => null);
      }

      let normalizedDocument: unknown = null;
      const normalizedKey =
        item.document?.normalizedKey ?? specificationDocument?.normalizedKey ?? null;
      if (normalizedKey) {
        normalizedDocument = await getJsonObject(normalizedKey).catch(() => null);
      }

      const previousQuestion = item.previousQuestionId
        ? await prisma.previousQuestion.findUnique({
            where: { id: item.previousQuestionId },
            include: { document: true },
          })
        : null;

      const artifactIds = new Set<string>();
      for (const d of evidenceDocuments) {
        if (d.discoveryArtifactId) artifactIds.add(d.discoveryArtifactId);
      }
      if (specificationDocument?.discoveryArtifactId) {
        artifactIds.add(specificationDocument.discoveryArtifactId);
      }
      if (item.document?.discoveryArtifactId) {
        artifactIds.add(item.document.discoveryArtifactId);
      }
      if (previousQuestion?.document?.discoveryArtifactId) {
        artifactIds.add(previousQuestion.document.discoveryArtifactId);
      }

      const discoveryResolved = await Promise.all(
        [...artifactIds].map(async (id) => {
          const resolved = await fetchArtifactProvenance(id);
          return resolved ? { discoveryArtifactId: id, ...resolved } : null;
        }),
      );
      const artifacts = discoveryResolved.filter(
        (r): r is NonNullable<typeof r> => r != null,
      );

      const briefObj =
        brief && typeof brief === "object" ? (brief as Record<string, unknown>) : null;
      const styleProfile =
        briefObj?.style ??
        briefObj?.styleProfile ??
        (Array.isArray(briefObj?.exemplars) ? { exemplars: briefObj.exemplars } : null);

      let examStyleProfile: unknown = null;
      const banca =
        typeof briefObj?.banca === "string"
          ? briefObj.banca
          : previousQuestion?.banca ?? null;
      const canonicalSubjectId =
        typeof briefObj?.canonicalSubjectId === "string"
          ? briefObj.canonicalSubjectId
          : previousQuestion?.canonicalKey?.split(":")[0] ?? null;
      if (banca && canonicalSubjectId) {
        examStyleProfile = await prisma.examStyleProfile
          .findFirst({
            where: { banca, canonicalSubjectId },
            orderBy: { updatedAt: "desc" },
          })
          .catch(() => null);
      }

      return {
        questionItem: {
          id: item.id,
          examSlug: item.examSlug,
          origin: item.origin,
          status: item.status,
          prompt: item.prompt,
          syllabusNodeId: item.syllabusNodeId,
          knowledgeUnitIds: kuIds,
          generationRunId: item.generationRunId,
          previousQuestionId: item.previousQuestionId,
        },
        syllabusNode: syllabusNode
          ? {
              id: syllabusNode.id,
              title: syllabusNode.title,
              pathSlug: syllabusNode.pathSlug,
              canonicalKey: syllabusNode.canonicalKey,
              syllabusVersion: syllabusNode.syllabus.version,
              sourceDocumentId: syllabusNode.syllabus.sourceDocumentId,
              path: syllabusAncestors,
            }
          : null,
        knowledgeUnits: knowledgeUnits.map((ku) => {
          const evidence = Array.isArray(ku.evidence)
            ? (ku.evidence as Array<Record<string, unknown>>)
            : [];
          return {
            id: ku.id,
            statement: ku.statement,
            canonicalKey: ku.canonicalKey,
            quality: ku.quality,
            evidence: evidence.map((ev) => ({
              ...ev,
              sourceUrl: ev.sourceUrl ?? null,
              span: evidenceSpan(ev),
            })),
          };
        }),
        chain: {
          knowledgeUnits: knowledgeUnits.map((ku) => ku.id),
          chunks: evidenceChunks.map((c) => ({
            id: c.id,
            documentId: c.documentId,
            sectionId: c.sectionId,
            sectionRole: c.section?.role ?? null,
            ordinal: c.ordinal,
            textPreview: c.text.slice(0, 240),
            span: null as [number, number] | null,
          })),
          sections: evidenceChunks
            .filter((c) => c.section)
            .map((c) => ({
              id: c.section!.id,
              documentId: c.section!.documentId,
              role: c.section!.role,
              heading: c.section!.heading,
            })),
          documents: [
            ...evidenceDocuments.map((d) => ({
              id: d.id,
              role: d.role,
              kind: d.kind,
              sourceUrl: d.sourceUrl,
              discoveryArtifactId: d.discoveryArtifactId,
              rank: d.rank,
              normalizedKey: d.normalizedKey,
            })),
            ...(specificationDocument
              ? [
                  {
                    id: specificationDocument.id,
                    role: specificationDocument.role,
                    kind: specificationDocument.kind,
                    sourceUrl: specificationDocument.sourceUrl,
                    discoveryArtifactId: specificationDocument.discoveryArtifactId,
                    rank: specificationDocument.rank,
                    normalizedKey: specificationDocument.normalizedKey,
                    purpose: "syllabus_source" as const,
                  },
                ]
              : []),
          ],
          artifacts: artifacts.map((a) => ({
            discoveryArtifactId: a.discoveryArtifactId,
            artifact: a.artifact,
            source: a.source,
            topicQuery: a.topicQuery,
          })),
          sources: artifacts
            .map((a) => a.source)
            .filter((s): s is NonNullable<typeof s> => s != null),
          topicQueries: artifacts
            .map((a) => a.topicQuery)
            .filter((t): t is NonNullable<typeof t> => t != null),
        },
        previousQuestion: previousQuestion
          ? {
              id: previousQuestion.id,
              fingerprint: previousQuestion.fingerprint,
              examFamily: previousQuestion.examFamily,
              banca: previousQuestion.banca,
              year: previousQuestion.year,
              number: previousQuestion.number,
              prompt: previousQuestion.prompt.slice(0, 400),
              document: previousQuestion.document
                ? {
                    id: previousQuestion.document.id,
                    role: previousQuestion.document.role,
                    kind: previousQuestion.document.kind,
                    sourceUrl: previousQuestion.document.sourceUrl,
                    discoveryArtifactId: previousQuestion.document.discoveryArtifactId,
                  }
                : null,
            }
          : null,
        styleProfile,
        examStyleProfile,
        document: item.document
          ? {
              id: item.document.id,
              role: item.document.role,
              kind: item.document.kind,
              sourceUrl: item.document.sourceUrl,
              discoveryArtifactId: item.document.discoveryArtifactId,
              rank: item.document.rank,
              normalizedKey: item.document.normalizedKey,
            }
          : null,
        generationRun: item.generationRun
          ? {
              id: item.generationRun.id,
              syllabusNodeId: item.generationRun.syllabusNodeId,
              promptVersion: item.generationRun.promptVersion,
              model: item.generationRun.model,
              tokensIn: item.generationRun.tokensIn,
              tokensOut: item.generationRun.tokensOut,
              briefKey: item.generationRun.briefKey,
              brief,
            }
          : null,
        normalizedDocument,
        reviews: item.reviews,
      };
    },
  );
}
