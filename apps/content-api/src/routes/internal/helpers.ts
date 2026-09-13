import type { FastifyRequest } from "fastify";
import { env } from "../../lib/env";

export function assertInternal(request: FastifyRequest): void {
  const key = request.headers["x-internal-key"];
  if (key !== env.internalApiKey && key !== env.adminInternalKey) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export function primaryEvidenceDomain(evidence: unknown): string | null {
  if (!Array.isArray(evidence)) return null;
  for (const raw of evidence) {
    if (!raw || typeof raw !== "object") continue;
    const url = String((raw as { sourceUrl?: unknown }).sourceUrl || "");
    if (!url) continue;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      continue;
    }
  }
  return null;
}
