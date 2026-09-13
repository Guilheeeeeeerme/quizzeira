import type { FastifyInstance } from "fastify";
import { openExamId } from "@quizzeira/shared";
import { prisma } from "../../lib/prisma";
import { examToWire } from "./helpers";

export async function registerInternalExamRoutes(app: FastifyInstance): Promise<void> {
  // ── Exams ─────────────────────────────────────────────────────────────────

  app.post<{ Body: Record<string, unknown> }>("/internal/open-exams", async (request) => {
    const body = request.body ?? {};
    const examSlug = String(body.examSlug || "");
    const listingUrl = String(body.listingUrl || "");
    const title = String(body.title || "");
    const editalUrl = (body.editalUrl as string) || null;
    const id = String(body.id || openExamId({ examSlug, listingUrl, title }));
    // Prefer the natural unique key — title-derived ids collide when the same
    // listing is rediscovered with a slightly different anchor text.
    const existing =
      (await prisma.exam.findUnique({
        where: { examSlug_listingUrl: { examSlug, listingUrl } },
      })) || (await prisma.exam.findUnique({ where: { id } }));
    const incomingStatus = (body.status as string) || "open";
    const examKind = (body.kind as string) || "concurso";
    const editionKey = (body.editionKey as string) || null;
    const detailUrl = (body.detailUrl as string) || null;
    const registrationEnd = body.registrationEnd
      ? new Date(String(body.registrationEnd))
      : null;
    const statusSource = (body.statusSource as string) || null;
    const positions = body.positions ?? undefined;
    // Preserve admin closes; don't let a weak listing signal demote an open exam.
    const nextStatus =
      existing?.status === "closed"
        ? "closed"
        : existing?.status === "open" && incomingStatus === "unknown"
          ? "open"
          : incomingStatus;
    const row = await prisma.exam.upsert({
      where: { examSlug_listingUrl: { examSlug, listingUrl } },
      create: {
        id: existing?.id || id,
        examSlug,
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        emphasis: body.emphasis ?? [],
        editalUrl,
        listingUrl,
        kind: examKind as never,
        editionKey,
        detailUrl,
        registrationEnd,
        statusSource,
        positions,
        status: nextStatus as never,
        sourceId: String(body.sourceId || ""),
        sourceDomain: String(body.sourceDomain || ""),
      },
      update: {
        title,
        org: (body.org as string) || null,
        banca: (body.banca as string) || null,
        emphasis: body.emphasis ?? [],
        editalUrl,
        kind: examKind as never,
        editionKey,
        detailUrl,
        registrationEnd,
        statusSource,
        positions,
        lastSeenAt: new Date(),
        status: nextStatus as never,
      },
    });
    return {
      record: examToWire(row),
      created: !existing,
      changed: !existing || existing.title !== title || existing.editalUrl !== editalUrl,
    };
  });

  app.post<{
    Params: { id: string };
    Body: Record<string, unknown>;
  }>("/internal/exams/:id/detail", async (request) => {
    const body = request.body ?? {};
    const row = await prisma.exam.update({
      where: { id: request.params.id },
      data: {
        editionKey: (body.editionKey as string) || undefined,
        detailUrl: (body.detailUrl as string) || undefined,
        registrationEnd: body.registrationEnd
          ? new Date(String(body.registrationEnd))
          : undefined,
        statusSource: (body.statusSource as string) || undefined,
        positions: body.positions ?? undefined,
        kind: (body.kind as never) || undefined,
      },
    });
    return { record: examToWire(row) };
  });

  app.get("/internal/open-exams", async () => {
    const items = await prisma.exam.findMany({
      where: { status: "open" },
      orderBy: { lastSeenAt: "desc" },
      take: 200,
    });
    return { items: items.map(examToWire) };
  });
}
