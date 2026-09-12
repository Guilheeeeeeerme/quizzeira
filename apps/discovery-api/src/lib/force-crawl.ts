// Concept: Ingestion (admin "crawl now" handoff)
//
// Kept in Postgres rather than Redis so discovery owns its own state and the
// flag survives a crawler restart. The crawler consumes one queued target per
// tick so multiple "Crawl now" clicks are not collapsed to the last source.
import { prisma } from "./prisma";

const FLAG_ID = "force-crawl";

type ForceState = {
  /** FIFO of source ids; `null` entry means "all enabled sources". */
  queue: Array<string | null>;
};

function asState(raw: unknown): ForceState {
  if (!raw || typeof raw !== "object") return { queue: [] };
  const obj = raw as { queue?: unknown; forced?: boolean; sourceId?: string | null };
  if (Array.isArray(obj.queue)) {
    return { queue: obj.queue.map((id) => (id == null || id === "" ? null : String(id))) };
  }
  // Back-compat with the previous single-slot shape.
  if (obj.forced) return { queue: [obj.sourceId ?? null] };
  return { queue: [] };
}

export async function requestForceCrawl(sourceId: string | null): Promise<void> {
  const row = await prisma.controlFlag.findUnique({ where: { id: FLAG_ID } });
  const state = asState(row?.value);
  state.queue.push(sourceId);
  // Cap so a runaway admin UI cannot grow forever.
  if (state.queue.length > 32) state.queue = state.queue.slice(-32);
  await prisma.controlFlag.upsert({
    where: { id: FLAG_ID },
    create: { id: FLAG_ID, value: state },
    update: { value: state, updatedAt: new Date() },
  });
}

export async function consumeForceCrawl(): Promise<{ forced: boolean; sourceId: string | null }> {
  const row = await prisma.controlFlag.findUnique({ where: { id: FLAG_ID } });
  const state = asState(row?.value);
  if (state.queue.length === 0) return { forced: false, sourceId: null };
  const sourceId = state.queue.shift() ?? null;
  await prisma.controlFlag.upsert({
    where: { id: FLAG_ID },
    create: { id: FLAG_ID, value: state },
    update: { value: state, updatedAt: new Date() },
  });
  return { forced: true, sourceId };
}
