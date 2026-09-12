const CACHE_MS = 24 * 60 * 60 * 1000;
const USER_AGENT =
  "QuizzeiraDiscoveryCrawler/0.1 (+https://quizzeira.local; research; polite)";

interface RobotsCacheEntry {
  fetchedAt: number;
  disallow: string[];
}

const cache = new Map<string, RobotsCacheEntry>();

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

async function loadRobots(domain: string): Promise<RobotsCacheEntry> {
  const cached = cache.get(domain);
  if (cached && Date.now() - cached.fetchedAt < CACHE_MS) return cached;

  const url = `https://${domain}/robots.txt`;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
    });
    const body = res.ok ? await res.text() : "";
    const entry = { fetchedAt: Date.now(), disallow: parseDisallow(body) };
    cache.set(domain, entry);
    return entry;
  } catch {
    const entry = { fetchedAt: Date.now(), disallow: [] };
    cache.set(domain, entry);
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
  cache.clear();
}
