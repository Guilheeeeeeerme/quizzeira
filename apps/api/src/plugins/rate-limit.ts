import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import { env } from "../lib/env";
import { redis } from "../lib/redis";

export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: true,
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindowMs,
    redis,
    skipOnError: false,
    allowList: (request) =>
      request.url === "/health" || request.url.startsWith("/internal"),
    keyGenerator: (request) => request.ip,
  });
}
