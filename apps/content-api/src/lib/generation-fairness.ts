/**
 * Poison-leaf guard for the generation planner-queue (§9 weighted fair
 * scheduling: "a single exam, provider, or poisoned job cannot consume the
 * queue"). The planner-queue recomputes each leaf's deficit fresh every
 * pass — a leaf with a bad brief (corrupted knowledge units, unparseable
 * source text) has a deficit that never closes, so without this guard it
 * would claim a generation slot on every single pass forever. Any `ok` or
 * `partial` result resets the streak; only unbroken recent failures count.
 */
export type GenerationRunOutcome = "ok" | "partial" | "failed" | "queued" | "running";

export function isLeafPoisoned(
  recentStatusesMostRecentFirst: GenerationRunOutcome[],
  threshold = 3,
): boolean {
  if (recentStatusesMostRecentFirst.length < threshold) return false;
  return recentStatusesMostRecentFirst.slice(0, threshold).every((status) => status === "failed");
}
