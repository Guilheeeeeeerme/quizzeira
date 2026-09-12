import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { env } from "../lib/env";
import { redis } from "../lib/redis";
import { ACCESS_COOKIE } from "./cookie";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: (request) => {
      if (request.url.startsWith("/internal")) return env.internalRateLimitMax;
      // Authenticated SPA (admin fan-out, study pages) needs a higher burst than
      // anonymous login/register; keep the tight limit for unauthenticated IPs.
      if (request.cookies?.[ACCESS_COOKIE]) return env.internalRateLimitMax;
      return env.rateLimitMax;
    },
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
