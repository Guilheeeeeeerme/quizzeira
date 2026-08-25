import type { PromptKey, PromptRecord } from "@quiz-app/shared";
import { DEFAULT_PROMPTS } from "../lib/default-prompts";
import { redis } from "../lib/redis";

export const PROMPT_KEYS = [
  "quiz-correction",
  "question-modernization",
  "difficulty-releveling",
] as const satisfies readonly PromptKey[];

const HISTORY_LIMIT = 20;

function currentKey(key: PromptKey): string {
  return `qa:prompt:current:${key}`;
}

function historyKey(key: PromptKey): string {
  return `qa:prompt:hist:${key}`;
}

export function isPromptKey(value: string): value is PromptKey {
  return (PROMPT_KEYS as readonly string[]).includes(value);
}

export async function getPrompt(key: PromptKey): Promise<PromptRecord> {
  const raw = await redis.get(currentKey(key));
  if (raw) return JSON.parse(raw) as PromptRecord;
  return seedPrompt(key);
}

export async function getPromptHistory(key: PromptKey): Promise<PromptRecord[]> {
  const items = await redis.lrange(historyKey(key), 0, HISTORY_LIMIT - 1);
  return items.map((item) => JSON.parse(item) as PromptRecord);
}

export async function putPrompt(
  key: PromptKey,
  body: string,
  note?: string,
): Promise<PromptRecord> {
  const existingRaw = await redis.get(currentKey(key));
  const existing = existingRaw ? (JSON.parse(existingRaw) as PromptRecord) : null;
  const record: PromptRecord = {
    key,
    version: (existing?.version ?? 0) + 1,
    body,
    updatedAt: new Date().toISOString(),
    note,
  };
  const pipeline = redis.pipeline();
  pipeline.set(currentKey(key), JSON.stringify(record));
  pipeline.lpush(historyKey(key), JSON.stringify(record));
  pipeline.ltrim(historyKey(key), 0, HISTORY_LIMIT - 1);
  await pipeline.exec();
  return record;
}

async function seedPrompt(key: PromptKey): Promise<PromptRecord> {
  const record: PromptRecord = {
    key,
    version: 1,
    body: DEFAULT_PROMPTS[key],
    updatedAt: new Date().toISOString(),
    note: "seed",
  };
  const pipeline = redis.pipeline();
  pipeline.set(currentKey(key), JSON.stringify(record));
  pipeline.lpush(historyKey(key), JSON.stringify(record));
  await pipeline.exec();
  return record;
}

export async function seedPrompts(): Promise<void> {
  for (const key of PROMPT_KEYS) {
    const exists = await redis.exists(currentKey(key));
    if (!exists) await seedPrompt(key);
  }
}
