// Concept: Cross-service run correlation (§31.3).

import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

const store = new AsyncLocalStorage<{ runId: string }>();

export function currentRunId(): string | undefined {
  return store.getStore()?.runId;
}

export function withRunId<T>(runId: string, fn: () => T): T {
  return store.run({ runId }, fn);
}

export async function withRunIdAsync<T>(runId: string, fn: () => Promise<T>): Promise<T> {
  return store.run({ runId }, fn);
}

export function newRunId(): string {
  return randomUUID().slice(0, 12);
}
