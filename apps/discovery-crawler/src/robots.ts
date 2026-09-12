/** Robots.txt cache + allow check (§11.5). */

export interface RobotsRules {
  fetchedAt: string;
  disallow: string[];
  crawlDelaySec: number | null;
}

const cache = new Map<string, RobotsRules>();

export async function fetchRobots(origin: string, userAgent: string): Promise<RobotsRules> {
  const key = origin.replace(/\/$/, "");
  const hit = cache.get(key);
  if (hit && Date.now() - Date.parse(hit.fetchedAt) < 24 * 3600_000) return hit;

  const rules: RobotsRules = {
    fetchedAt: new Date().toISOString(),
    disallow: [],
    crawlDelaySec: null,
  };

  try {
    const res = await fetch(`${key}/robots.txt`, {
      headers: { "user-agent": userAgent },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const body = await res.text();
      let inAgent = false;
      for (const line of body.split(/\n/)) {
        const t = line.trim();
        if (/^user-agent:\s*\*/i.test(t)) {
          inAgent = true;
          continue;
        }
        if (/^user-agent:/i.test(t)) {
          inAgent = false;
          continue;
        }
        if (!inAgent) continue;
        const dis = t.match(/^disallow:\s*(.*)$/i);
        if (dis) {
          const path = dis[1].trim();
          if (path) rules.disallow.push(path);
        }
        const delay = t.match(/^crawl-delay:\s*([\d.]+)/i);
        if (delay) rules.crawlDelaySec = Number(delay[1]);
      }
    }
  } catch {
    // Fail open with empty disallow — politeness still applies.
  }

  cache.set(key, rules);
  return rules;
}

export function isAllowedByRobots(url: string, rules: RobotsRules): boolean {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return false;
  }
  for (const rule of rules.disallow) {
    if (rule === "/") return false;
    if (path.startsWith(rule)) return false;
  }
  return true;
}

/** SSRF guard: block private/link-local/metadata hosts. */
export function isPublicHttpUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return false;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0)/.test(host)) return false;
  if (/^\[?::1\]?$/.test(host)) return false;
  return true;
}
