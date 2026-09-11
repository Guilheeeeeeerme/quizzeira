import type { PromptKey, PromptRecord } from "@quizzeira/shared";
import { DEFAULT_PROMPTS } from "../lib/default-prompts";
import { redis } from "../lib/redis";

export const PROMPT_KEYS = ["quiz-correction"] as const satisfies readonly PromptKey[];

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

function pendingKey(key: PromptKey): string {
  return `qa:prompt:pending:${key}`;
}

/** Stage a prompt change for admin approval (does not mutate live prompt). */
export async function proposePrompt(
  key: PromptKey,
  body: string,
  note?: string,
): Promise<{ key: PromptKey; body: string; note?: string; proposedAt: string; currentVersion: number }> {
  const current = await getPrompt(key);
  const proposal = {
    key,
    body,
    note,
    proposedAt: new Date().toISOString(),
    currentVersion: current.version,
  };
  await redis.set(pendingKey(key), JSON.stringify(proposal));
  return proposal;
}

export async function listPromptProposals(): Promise<
  Array<{ key: PromptKey; body: string; note?: string; proposedAt: string; currentVersion: number }>
> {
  const out = [];
  for (const key of PROMPT_KEYS) {
    const raw = await redis.get(pendingKey(key));
    if (raw) out.push(JSON.parse(raw));
  }
  return out;
}

export async function approvePromptProposal(key: PromptKey): Promise<PromptRecord> {
  const raw = await redis.get(pendingKey(key));
  if (!raw) {
    throw Object.assign(new Error("No pending prompt proposal"), { statusCode: 404 });
  }
  const proposal = JSON.parse(raw) as { body: string; note?: string };
  const record = await putPrompt(key, proposal.body, proposal.note ?? "approved");
  await redis.del(pendingKey(key));
  return record;
}

export async function rejectPromptProposal(key: PromptKey): Promise<{ ok: true }> {
  await redis.del(pendingKey(key));
  return { ok: true };
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
    const raw = await redis.get(currentKey(key));
    if (!raw) {
      await seedPrompt(key);
      continue;
    }
    const existing = JSON.parse(raw) as PromptRecord;
    // Refresh virgin seed bodies when defaults change; leave operator-edited prompts alone.
    if (existing.note === "seed" && existing.body !== DEFAULT_PROMPTS[key]) {
      await putPrompt(key, DEFAULT_PROMPTS[key], "seed");
    }
  }
}
