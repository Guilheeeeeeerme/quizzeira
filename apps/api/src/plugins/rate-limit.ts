import type { FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import Redis from "ioredis";
import { env } from "../lib/env";

export async function registerRateLimit(app: FastifyInstance) {
  const redis = new Redis(env.redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
  });

  app.addHook("onClose", async () => {
    await redis.quit();
  });

  await app.register(rateLimit, {
    global: true,
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindowMs,
    redis,
    skipOnError: false,
    allowList: (request) => request.url === "/health",
    keyGenerator: (request) => request.ip,
  });
}
