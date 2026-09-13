import type { FastifyRequest } from "fastify";
import { env } from "../../lib/env";

export function assertInternal(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.internalApiKey && key !== env.adminInternalKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export function strategyToWire(value: string): string {
  return value.replace("_", "-");
}

export function examToWire(row: {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  emphasis: unknown;
  editalUrl: string | null;
  listingUrl: string;
  kind?: string;
  editionKey?: string | null;
  detailUrl?: string | null;
  registrationEnd?: Date | null;
  statusSource?: string | null;
  positions?: unknown;
  status: string;
  sourceId: string;
  sourceDomain: string;
  discoveredAt: Date;
  lastSeenAt: Date;
}) {
  return {
    id: row.id,
    examSlug: row.examSlug,
    title: row.title,
    org: row.org,
    banca: row.banca,
    emphasis: row.emphasis,
    editalUrl: row.editalUrl,
    listingUrl: row.listingUrl,
    kind: row.kind ?? "concurso",
    editionKey: row.editionKey ?? null,
    detailUrl: row.detailUrl ?? null,
    registrationEnd: row.registrationEnd?.toISOString() ?? null,
    statusSource: row.statusSource ?? null,
    positions: row.positions ?? null,
    status: row.status === "open" ? ("open" as const) : ("unknown" as const),
    sourceId: row.sourceId,
    sourceDomain: row.sourceDomain,
    discoveredAt: row.discoveredAt.toISOString(),
    lastSeenAt: row.lastSeenAt.toISOString(),
  };
}
