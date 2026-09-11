// Concept: Ingestion (admin "crawl now" handoff)
//
// Kept in Postgres rather than Redis so discovery owns its own state and the
// flag survives a crawler restart. The crawler consumes the flag at tick start.
import { prisma } from "./prisma";

const FLAG_ID = "force-crawl";

export async function requestForceCrawl(sourceId: string | null): Promise<void> {
  await prisma.controlFlag.upsert({
    where: { id: FLAG_ID },
    create: { id: FLAG_ID, value: { forced: true, sourceId } },
    update: { value: { forced: true, sourceId }, updatedAt: new Date() },
  });
}

export async function consumeForceCrawl(): Promise<{ forced: boolean; sourceId: string | null }> {
  const row = await prisma.controlFlag.findUnique({ where: { id: FLAG_ID } });
  const value = (row?.value ?? null) as { forced?: boolean; sourceId?: string | null } | null;
  if (!value?.forced) return { forced: false, sourceId: null };
  await prisma.controlFlag.update({
    where: { id: FLAG_ID },
    data: { value: { forced: false, sourceId: null } },
  });
  return { forced: true, sourceId: value.sourceId ?? null };
}
