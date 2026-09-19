const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 60 * 60_000;

/**
 * Exponential backoff with full jitter, doubling per attempt from
 * `BASE_BACKOFF_MS` and capped at `MAX_BACKOFF_MS` so a poison job can never
 * monopolize the queue by retrying in a tight loop (§5).
 */
export function computeBackoffMs(attempts: number, random: () => number = Math.random): number {
  const exponent = Math.max(0, attempts - 1);
  const cap = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** exponent);
  return Math.floor(random() * cap);
}
