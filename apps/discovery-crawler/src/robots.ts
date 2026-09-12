// Concept: robots.txt cache + disallow checks (§11.5).
import { dmzPatch } from "@quizzeira/worker-kit";

export interface RobotsCache {
  fetchedAt: string;
  disallow: string[];
  allowAll?: boolean;
}

const cache = new Map<string, RobotsCache>();

export function parseRobotsTxt(text: string, userAgent = "Quizzeira"): string[] {
  const lines = text.split(/\r?\n/);
  const disallow: string[] = [];
  let inGroup = false;
  let starGroup = false;
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const ua = /^user-agent\s*:\s*(.+)$/i.exec(line);
    if (ua) {
      const agent = ua[1].trim().toLowerCase();
      inGroup = agent === "*" || agent.includes(userAgent.toLowerCase());
      if (agent === "*") starGroup = true;
      continue;
    }
    if (!inGroup && !starGroup) continue;
    const dis = /^disallow\s*:\s*(.*)$/i.exec(line);
    if (dis && inGroup) {
      const path = dis[1].trim();
      if (path) disallow.push(path);
    }
  }
  return disallow;
}

export function isPathAllowed(url: string, disallow: string[]): boolean {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  for (const rule of disallow) {
    if (!rule) continue;
    if (rule === "/") return false;
    if (path.startsWith(rule)) return false;
  }
  return true;
}

export async function getRobotsForDomain(
  domain: string,
  sourceId?: string,
  existing?: RobotsCache | null,
): Promise<RobotsCache> {
  const cached = cache.get(domain) || existing;
  if (cached) {
    const age = Date.now() - new Date(cached.fetchedAt).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      cache.set(domain, cached);
      return cached;
    }
  }
  try {
    const res = await fetch(`https://${domain}/robots.txt`, {
      headers: { "user-agent": "QuizzeiraDiscoveryCrawler/0.1" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const empty: RobotsCache = { fetchedAt: new Date().toISOString(), disallow: [], allowAll: true };
      cache.set(domain, empty);
      return empty;
    }
    const text = await res.text();
    const entry: RobotsCache = {
      fetchedAt: new Date().toISOString(),
      disallow: parseRobotsTxt(text),
    };
    cache.set(domain, entry);
    if (sourceId) {
      await dmzPatch(`/internal/sources/${sourceId}`, { robotsCache: entry }).catch(() => undefined);
    }
    return entry;
  } catch {
    const empty: RobotsCache = { fetchedAt: new Date().toISOString(), disallow: [], allowAll: true };
    cache.set(domain, empty);
    return empty;
  }
}
