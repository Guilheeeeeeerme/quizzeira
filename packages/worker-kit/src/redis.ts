import Redis from "ioredis";
import { workerEnv } from "./env";

let client: Redis | null | undefined;

/** Shared Redis client for LLM budgets. Returns null when REDIS_URL is unset (tests / local memory mode). */
export function getWorkerRedis(): Redis | null {
  if (client !== undefined) return client;
  if (!workerEnv.redisUrl) {
    client = null;
    return null;
  }
  client = new Redis(workerEnv.redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });
  return client;
}

export async function resetWorkerRedisForTests(): Promise<void> {
  if (client) {
    try {
      await client.quit();
    } catch {
      // ignore
    }
  }
  client = undefined;
}
