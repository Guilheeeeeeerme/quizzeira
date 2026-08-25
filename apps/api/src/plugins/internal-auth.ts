import { createHash, timingSafeEqual } from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../lib/env";

function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export async function authenticateInternal(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const header = request.headers["x-internal-key"];
  const provided = Array.isArray(header) ? header[0] : header;
  if (!provided || !safeEqual(provided, env.internalApiKey)) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
}
