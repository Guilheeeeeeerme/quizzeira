import { dmzGet, dmzPost, logInfo, logWarn } from "@quizzeira/worker-kit";
import { freshnessEnv } from "./env.js";
import { fingerprintFromHeaders, selectWatchBatch, type WatchEntry } from "./watchlist.js";

const NAME = "content-freshness";

let watchCursor = 0;

/** In-process last fingerprints (survives for the process lifetime; API stores durable). */
const localFp = new Map<string, string>();

export interface FreshnessAction {
  id: string;
  url: string;
  changed: boolean;
  reported: boolean;
  detail?: string;
}

export interface FreshnessPassSummary {
  scanned: number;
  changed: number;
  reported: number;
  actions: FreshnessAction[];
}

async function headFingerprint(url: string): Promise<{
  ok: boolean;
  fingerprint: string;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
  error?: string;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), freshnessEnv.probeTimeoutMs);
  try {
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "QuizzeiraContentFreshness/1.0" },
    });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "QuizzeiraContentFreshness/1.0",
          range: "bytes=0-0",
        },
      });
    }
    if (!(res.status >= 200 && res.status < 400)) {
      return { ok: false, fingerprint: "", error: `http_${res.status}` };
    }
    const etag = res.headers.get("etag");
    const lastModified = res.headers.get("last-modified");
    const contentLength = res.headers.get("content-length");
    return {
      ok: true,
      fingerprint: fingerprintFromHeaders({ etag, lastModified, contentLength }),
      etag,
      lastModified,
      contentLength,
    };
  } catch (err) {
    return {
      ok: false,
      fingerprint: "",
      error: err instanceof Error ? err.message.slice(0, 200) : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function observe(entry: WatchEntry, fp: {
  fingerprint: string;
  etag?: string | null;
  lastModified?: string | null;
  contentLength?: string | null;
  changed: boolean;
}): Promise<boolean> {
  if (freshnessEnv.dryRun) return false;
  await dmzPost("/internal/freshness/observe", {
    watchId: entry.id,
    title: entry.title,
    url: entry.url,
    topicTags: entry.topicTags,
    fingerprint: fp.fingerprint,
    etag: fp.etag ?? null,
    lastModified: fp.lastModified ?? null,
    contentLength: fp.contentLength ?? null,
    changed: fp.changed,
  });
  return true;
}

/**
 * Probe legislation watchlist URLs. On fingerprint change, ask content-api to
 * requeue matching knowledge documents (and optionally quarantine later).
 *
 * No Gemini / no JEV — amendment *detection* is HTTP metadata; semantic
 * "did this invalidate question X?" stays on the Eval/judge path when content
 * is reprocessed.
 */
export async function runFreshnessPass(): Promise<FreshnessPassSummary> {
  const { items, nextCursor } = selectWatchBatch(watchCursor, freshnessEnv.maxPerPass);
  watchCursor = nextCursor;

  // Also pull any content-api tracked watches (documents already ingested).
  let apiCandidates: Array<{ watchId: string; url: string; fingerprint: string | null }> = [];
  try {
    const res = await dmzGet<{ items: Array<{ watchId: string; url: string; fingerprint: string | null }> }>(
      "/internal/freshness/watches",
    );
    apiCandidates = res.items ?? [];
  } catch {
    // API may not have watches yet on first deploy.
  }

  const byUrl = new Map<string, WatchEntry>();
  for (const e of items) byUrl.set(e.url, e);
  for (const c of apiCandidates.slice(0, freshnessEnv.maxPerPass)) {
    if (!byUrl.has(c.url)) {
      byUrl.set(c.url, {
        id: c.watchId,
        title: c.watchId,
        url: c.url,
        topicTags: [],
      });
      if (c.fingerprint) localFp.set(c.url, c.fingerprint);
    }
  }

  const actions: FreshnessAction[] = [];
  for (const entry of byUrl.values()) {
    const head = await headFingerprint(entry.url);
    if (!head.ok) {
      actions.push({
        id: entry.id,
        url: entry.url,
        changed: false,
        reported: false,
        detail: head.error,
      });
      continue;
    }
    const prev = localFp.get(entry.url);
    const changed = Boolean(prev && prev !== head.fingerprint && head.fingerprint !== "||");
    localFp.set(entry.url, head.fingerprint);
    let reported = false;
    try {
      reported = await observe(entry, {
        fingerprint: head.fingerprint,
        etag: head.etag,
        lastModified: head.lastModified,
        contentLength: head.contentLength,
        changed,
      });
    } catch (err) {
      logWarn("freshness observe failed", {
        worker: NAME,
        watchId: entry.id,
        error: err instanceof Error ? err.message.slice(0, 160) : String(err),
      });
    }
    actions.push({
      id: entry.id,
      url: entry.url,
      changed,
      reported,
      detail: changed ? "fingerprint_changed" : undefined,
    });
  }

  const summary: FreshnessPassSummary = {
    scanned: actions.length,
    changed: actions.filter((a) => a.changed).length,
    reported: actions.filter((a) => a.reported).length,
    actions,
  };
  logInfo("content freshness pass", {
    worker: NAME,
    dryRun: freshnessEnv.dryRun,
    scanned: summary.scanned,
    changed: summary.changed,
    reported: summary.reported,
  });
  return summary;
}
