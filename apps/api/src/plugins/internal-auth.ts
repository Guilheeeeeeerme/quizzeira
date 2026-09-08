import { createHash, timingSafeEqual } from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../lib/env";

export type InternalScope =
  | "reviews"
  | "pills"
  | "prompts"
  | "questions"
  | "bank"
  | "topics"
  | "crawler"
  | "*";

declare module "fastify" {
  interface FastifyRequest {
    internalScopes?: Set<InternalScope>;
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

const ALL_SCOPES: InternalScope[] = [
  "reviews",
  "pills",
  "prompts",
  "questions",
  "bank",
  "topics",
  "crawler",
  "*",
];

function parseScopes(raw: string): Set<InternalScope> {
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as InternalScope[];
  if (parts.includes("*") || parts.length === 0) {
    return new Set<InternalScope>(["*"]);
  }
  return new Set(parts.filter((p) => ALL_SCOPES.includes(p)));
}

/** Resolve x-internal-key → scopes. Legacy INTERNAL_API_KEY maps to full "*". */
function resolveKey(provided: string): Set<InternalScope> | null {
  for (const entry of env.internalApiKeys) {
    if (safeEqual(provided, entry.key)) {
      return parseScopes(entry.scopes);
    }
  }
  if (safeEqual(provided, env.internalApiKey)) {
    return new Set<InternalScope>(["*"]);
  }
  return null;
}

export function pathRequiresScope(url: string): InternalScope | null {
  const path = url.split("?")[0] ?? url;
  if (path === "/health" || path.endsWith("/health")) return null;
  if (path.includes("/reviews")) return "reviews";
  if (path.includes("/pills")) return "pills";
  if (path.includes("/prompts")) return "prompts";
  if (path.includes("/questions")) return "questions";
  if (path.includes("/question-bank")) return "bank";
  if (path.includes("/topics")) return "topics";
  if (path.includes("/crawler") || path.includes("/open-exams") || path.includes("/catalog")) {
    return "crawler";
  }
  return "*";
}

export function hasScope(scopes: Set<InternalScope> | undefined, needed: InternalScope): boolean {
  if (!scopes) return false;
  if (scopes.has("*")) return true;
  return scopes.has(needed);
}

export async function authenticateInternal(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers["x-internal-key"];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  const scopes = resolveKey(provided);
  if (!scopes) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  request.internalScopes = scopes;

  const needed = pathRequiresScope(request.url);
  if (needed && !hasScope(scopes, needed)) {
    return reply.code(403).send({ error: "Forbidden: insufficient internal scope" });
  }
}
