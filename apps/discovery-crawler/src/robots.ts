import { dmzGet, dmzPut } from "@quizzeira/worker-kit";

const CACHE_MS = 24 * 60 * 60 * 1000;
const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";

interface RobotsCacheEntry {
  fetchedAt: number;
  disallow: string[];
}

/** In-process cache keyed by domain (hot path). */
const memoryCache = new Map<string, RobotsCacheEntry>();
/** Optional sourceId → domain so we can persist to Source.robotsCache. */
const sourceByDomain = new Map<string, string>();

function parseDisallow(body: string): string[] {
  const lines = body.split(/\r?\n/);
  const disallow: string[] = [];
  let applies = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const ua = trimmed.match(/^User-agent:\s*(.+)$/i);
    if (ua) {
      applies = ua[1] === "*" || ua[1].toLowerCase().includes("quizzeira");
      continue;
    }
    if (!applies) continue;
    const d = trimmed.match(/^Disallow:\s*(.*)$/i);
    if (d) disallow.push(d[1].trim());
  }
  return disallow;
}

/** Bind a source id so robots cache can be written to Postgres. */
export function bindRobotsSource(domain: string, sourceId: string): void {
  sourceByDomain.set(domain.toLowerCase(), sourceId);
}

async function loadPersisted(domain: string): Promise<RobotsCacheEntry | null> {
  const sourceId = sourceByDomain.get(domain.toLowerCase());
  if (!sourceId) return null;
  try {
    const res = await dmzGet<{ robotsCache: RobotsCacheEntry | null }>(
      `/internal/sources/${sourceId}/robots-cache`,
    );
    const entry = res.robotsCache;
    if (!entry || typeof entry.fetchedAt !== "number" || !Array.isArray(entry.disallow)) {
      return null;
    }
    if (Date.now() - entry.fetchedAt >= CACHE_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function persist(domain: string, entry: RobotsCacheEntry): Promise<void> {
  const sourceId = sourceByDomain.get(domain.toLowerCase());
  if (!sourceId) return;
  try {
    await dmzPut(`/internal/sources/${sourceId}/robots-cache`, entry);
  } catch {
    /* persistence must not block crawl */
  }
}

async function loadRobots(domain: string): Promise<RobotsCacheEntry> {
  const key = domain.toLowerCase();
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached;

  const persisted = await loadPersisted(key);
  if (persisted) {
    memoryCache.set(key, persisted);
    return persisted;
  }

  const url = `https://${domain}/robots.txt`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    const body = res.ok ? await res.text() : "";
    const entry = { fetchedAt: Date.now(), disallow: parseDisallow(body) };
    memoryCache.set(key, entry);
    void persist(key, entry);
    return entry;
  } catch {
    const entry = { fetchedAt: Date.now(), disallow: [] as string[] };
    memoryCache.set(key, entry);
    void persist(key, entry);
    return entry;
  }
}

/** Returns false when robots.txt explicitly disallows the path. */
export async function isAllowedByRobots(url: string, domain: string): Promise<boolean> {
  if (process.env.DISCOVERY_CRAWLER_SKIP_ROBOTS === "true") return true;
  const entry = await loadRobots(domain);
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return true;
  }
  for (const rule of entry.disallow) {
    if (!rule) continue;
    if (path.startsWith(rule)) return false;
  }
  return true;
}

export function clearRobotsCache(): void {
  memoryCache.clear();
}
