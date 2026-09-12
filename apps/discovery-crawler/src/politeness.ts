// Concept: Per-domain politeness (§11.5).
const lastFetchAt = new Map<string, number>();

export async function waitForDomain(domain: string, politenessMs: number): Promise<void> {
  const last = lastFetchAt.get(domain) ?? 0;
  const wait = Math.max(0, politenessMs - (Date.now() - last));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastFetchAt.set(domain, Date.now());
}

export function markFetched(domain: string): void {
  lastFetchAt.set(domain, Date.now());
}
