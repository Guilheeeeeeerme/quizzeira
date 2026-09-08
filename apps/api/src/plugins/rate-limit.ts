import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { env } from "../lib/env";
import { redis } from "../lib/redis";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: (request) =>
      request.url.startsWith("/internal")
        ? env.internalRateLimitMax
        : env.rateLimitMax,
    timeWindow: env.rateLimitWindowMs,
    redis,
    skipOnError: false,
    allowList: (request) => request.url === "/health",
    keyGenerator: (request) =>
      request.url.startsWith("/internal")
        ? `internal:${request.ip}`
        : request.ip,
  });
}
