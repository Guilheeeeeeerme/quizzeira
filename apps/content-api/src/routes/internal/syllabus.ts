import type { FastifyInstance } from "fastify";
import { prisma } from "../../lib/prisma";
import {
  listUnembeddedSyllabusLeaves,
  setSyllabusNodeEmbedding,
  getSyllabusNodeEmbeddings,
} from "../../lib/vectors";

export async function registerInternalSyllabusRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: Record<string, unknown> }>("/internal/syllabi", async (request) => {
    const body = request.body ?? {};
    const examSlug = String(body.examSlug || "").trim();
    if (!examSlug) {
      throw Object.assign(new Error("examSlug is required"), { statusCode: 400 });
    }

    const latest = await prisma.syllabus.findFirst({
      where: { examSlug },
      orderBy: { version: "desc" },
    });
    const version = (latest?.version ?? 0) + 1;

    const syllabus = await prisma.syllabus.create({
      data: {
        examSlug,
        version,
        sourceDocumentId: String(body.sourceDocumentId),
        sourceDocumentHash: String(body.sourceDocumentHash),
        status: String(body.status || "active"),
      },
    });

    const positions = (body.positions as Array<Record<string, unknown>>) ?? [];
    const positionRows = await Promise.all(
      positions.map((p) =>
        prisma.position.create({
          data: {
            syllabusId: syllabus.id,
            title: String(p.title),
            slug: String(p.slug),
            implicit: Boolean(p.implicit),
            vacancies: p.vacancies != null ? Number(p.vacancies) : null,
          },
        }),
      ),
    );
    const slugToId = new Map(positionRows.map((p) => [p.slug, p.id]));

    const nodes = (body.nodes as Array<Record<string, unknown>>) ?? [];
    const pathSlugToId = new Map<string, string>();
    for (const n of nodes.sort((a, b) => Number(a.depth) - Number(b.depth))) {
      const pathSlug = String(n.pathSlug);
      const parentPathSlug = n.parentPathSlug ? String(n.parentPathSlug) : null;
      const positionSlugs = (n.positionSlugs as string[]) ?? [];
      const created = await prisma.syllabusNode.create({
        data: {
          syllabusId: syllabus.id,
          parentId: parentPathSlug ? pathSlugToId.get(parentPathSlug) ?? null : null,
          depth: Number(n.depth),
          ordinal: Number(n.ordinal),
          title: String(n.title),
          rawText: String(n.rawText),
          pathSlug,
          canonicalSubjectId: (n.canonicalSubjectId as string) ?? null,
          canonicalKey: String(n.canonicalKey),
          scope: String(n.scope || "basic"),
          positionIds: positionSlugs.map((s) => slugToId.get(s) ?? s),
          extraction: (n.extraction as never) ?? {},
        },
      });
      pathSlugToId.set(pathSlug, created.id);
    }

    return { syllabusId: syllabus.id, version, nodeCount: nodes.length };
  });

  /** Resolve whether a syllabus node is an active leaf for an exam. */
  app.get("/internal/syllabus-nodes/:id", async (request) => {
    const id = String((request.params as { id: string }).id || "").trim();
    const node = await prisma.syllabusNode.findUnique({
      where: { id },
      include: {
        syllabus: true,
      },
    });
    if (!node || node.syllabus.status !== "active") {
      return { node: null, isLeaf: false, path: [] as string[] };
    }
    const siblings = await prisma.syllabusNode.findMany({
      where: { syllabusId: node.syllabusId },
      select: { id: true, parentId: true, title: true, depth: true },
    });
    const hasChild = siblings.some((s) => s.parentId === node.id);
    const byId = new Map(siblings.map((s) => [s.id, s]));
    const path: string[] = [];
    let cur: { id: string; parentId: string | null; title: string } | undefined = node;
    while (cur) {
      path.unshift(cur.title);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return {
      node: {
        id: node.id,
        title: node.title,
        pathSlug: node.pathSlug,
        examSlug: node.syllabus.examSlug,
        depth: node.depth,
      },
      isLeaf: !hasChild,
      path,
    };
  });

  /** Active syllabus leaves for an exam (mapping + distill). */
  app.get<{ Params: { examSlug: string } }>(
    "/internal/syllabi/:examSlug/leaves",
    async (request) => {
      const examSlug = decodeURIComponent(request.params.examSlug);
      const syllabus = await prisma.syllabus.findFirst({
        where: { examSlug, status: "active" },
        orderBy: { version: "desc" },
      });
      if (!syllabus) return { leaves: [] };
      const nodes = await prisma.syllabusNode.findMany({
        where: { syllabusId: syllabus.id },
        orderBy: [{ depth: "asc" }, { ordinal: "asc" }],
      });
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const maxDepth = nodes.reduce((m, n) => Math.max(m, n.depth), 0);
      const leaves = nodes
        .filter((n) => n.depth === maxDepth || !nodes.some((c) => c.parentId === n.id))
        .map((n) => {
          const parent = n.parentId ? byId.get(n.parentId) : null;
          return {
            id: n.id,
            title: n.title,
            pathSlug: n.pathSlug,
            canonicalKey: n.canonicalKey,
            canonicalSubjectId: n.canonicalSubjectId,
            parentTitle: parent?.title ?? null,
            depth: n.depth,
          };
        });
      return { leaves, syllabusId: syllabus.id, version: syllabus.version };
    },
  );

  app.get("/internal/embeddings/syllabus-leaves", async (request) => {
    const q = request.query as { limit?: string };
    const items = await listUnembeddedSyllabusLeaves(Number(q.limit || 32));
    return { items };
  });

  app.put<{ Params: { id: string }; Body: { embedding: number[] } }>(
    "/internal/syllabus-nodes/:id/embedding",
    async (request) => {
      const embedding = request.body?.embedding;
      if (!Array.isArray(embedding)) {
        throw Object.assign(new Error("embedding must be a number array"), { statusCode: 400 });
      }
      await setSyllabusNodeEmbedding(request.params.id, embedding);
      return { ok: true };
    },
  );

  app.post<{ Body: { ids: string[] } }>("/internal/syllabus-nodes/embeddings", async (request) => {
    const ids = Array.isArray(request.body?.ids) ? request.body.ids.map(String) : [];
    const items = await getSyllabusNodeEmbeddings(ids.slice(0, 80));
    return { items };
  });
}
