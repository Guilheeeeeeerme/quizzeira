export interface ProbeResult {
  ok: boolean;
  status?: number;
  error?: string;
  etag?: string | null;
  lastModified?: string | null;
}

/**
 * Lightweight reachability check for a Source startUrl.
 * Prefers HEAD; falls back to GET when HEAD is rejected.
 */
export async function probeUrl(url: string, timeoutMs: number): Promise<ProbeResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "QuizzeiraPortalMonitor/1.0 (+https://concurseria.ferredemo.dev)" },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "QuizzeiraPortalMonitor/1.0 (+https://concurseria.ferredemo.dev)",
          range: "bytes=0-0",
        },
      });
    }
    const ok = res.status >= 200 && res.status < 400;
    return {
      ok,
      status: res.status,
      etag: res.headers.get("etag"),
      lastModified: res.headers.get("last-modified"),
      error: ok ? undefined : `http_${res.status}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message.slice(0, 200) };
  } finally {
    clearTimeout(timer);
  }
}

export function isStale(lastOkAt: string | null | undefined, staleHours: number, now = Date.now()): boolean {
  if (!lastOkAt) return true;
  const ts = Date.parse(lastOkAt);
  if (!Number.isFinite(ts)) return true;
  return now - ts > staleHours * 3600_000;
}
