const lastFetchByDomain = new Map<string, number>();

export async function waitForDomain(domain: string, politenessMs: number): Promise<void> {
  const delay = Math.max(0, politenessMs);
  const last = lastFetchByDomain.get(domain) ?? 0;
  const elapsed = Date.now() - last;
  if (elapsed < delay) {
    await new Promise((r) => setTimeout(r, delay - elapsed));
  }
  lastFetchByDomain.set(domain, Date.now());
}

export function resetPoliteness(): void {
  lastFetchByDomain.clear();
}
