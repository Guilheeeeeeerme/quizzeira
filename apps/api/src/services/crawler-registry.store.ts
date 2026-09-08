import type {
  CrawlerObservability,
  CrawlerRunSummary,
  CrawlerSource,
  OpenExamRecord,
} from "@quizzeira/shared";
import {
  crawlerLastRunKey,
  crawlerRunLockKey,
  crawlerSourceId,
  domainFromUrl,
  openExamFingerprint,
  openExamId,
  openExamIndexKey,
  openExamKey,
  registryIndexKey,
  registrySourceKey,
  sourceListingFingerprintKey,
} from "@quizzeira/shared";
import { redis } from "../lib/redis";
import { STARTER_CRAWLER_SOURCES } from "../lib/crawler-seed";

const DEFAULT_TTL_SECONDS = 180 * 24 * 60 * 60; // ~6 months for registry

function nowIso(): string {
  return new Date().toISOString();
}

export async function listCrawlerSources(filter?: {
  status?: CrawlerSource["status"];
}): Promise<CrawlerSource[]> {
  const ids = await redis.smembers(registryIndexKey());
  if (ids.length === 0) return [];
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(registrySourceKey(id));
  const rows = await pipeline.exec();
  const items: CrawlerSource[] = [];
  for (const row of rows ?? []) {
    const raw = row?.[1];
    if (typeof raw !== "string" || !raw) continue;
    try {
      const src = JSON.parse(raw) as CrawlerSource;
      if (filter?.status && src.status !== filter.status) continue;
      items.push(src);
    } catch {
      /* skip */
    }
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertCrawlerSource(
  patch: Partial<CrawlerSource> & Pick<CrawlerSource, "domain" | "name" | "startUrls">,
): Promise<CrawlerSource> {
  const domain = patch.domain.replace(/^www\./, "").toLowerCase();
  const id = patch.id ?? crawlerSourceId(domain, patch.name);
  const existingRaw = await redis.get(registrySourceKey(id));
  let existing: CrawlerSource | null = null;
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw) as CrawlerSource;
    } catch {
      existing = null;
    }
  }
  const stamp = nowIso();
  const source: CrawlerSource = {
    id,
    domain,
    name: patch.name,
    startUrls: patch.startUrls,
    strategy: patch.strategy ?? existing?.strategy ?? "listing-links",
    linkSelector: patch.linkSelector ?? existing?.linkSelector,
    // "concurso" matches Portuguese href/text on Brazilian listing sites (external content).
    linkPatterns: patch.linkPatterns ?? existing?.linkPatterns ?? ["concurso", "edital", "processo seletivo"],
    openPatterns:
      patch.openPatterns ??
      existing?.openPatterns ?? ["inscri", "aberto", "edital publicado"],
    trust: patch.trust ?? existing?.trust ?? "medium",
    status: patch.status ?? existing?.status ?? "active",
    politenessMs: patch.politenessMs ?? existing?.politenessMs ?? 1500,
    failCount: patch.failCount ?? existing?.failCount ?? 0,
    lastOkAt: patch.lastOkAt !== undefined ? patch.lastOkAt : existing?.lastOkAt ?? null,
    lastError: patch.lastError !== undefined ? patch.lastError : existing?.lastError ?? null,
    notes: patch.notes ?? existing?.notes,
    createdAt: existing?.createdAt ?? stamp,
    updatedAt: stamp,
  };
  await redis
    .pipeline()
    .set(registrySourceKey(id), JSON.stringify(source), "EX", DEFAULT_TTL_SECONDS)
    .sadd(registryIndexKey(), id)
    .expire(registryIndexKey(), DEFAULT_TTL_SECONDS)
    .exec();
  return source;
}

export async function markSourceHealth(
  id: string,
  result: { ok: boolean; error?: string },
): Promise<CrawlerSource | null> {
  const raw = await redis.get(registrySourceKey(id));
  if (!raw) return null;
  const source = JSON.parse(raw) as CrawlerSource;
  if (result.ok) {
    source.failCount = 0;
    source.lastOkAt = nowIso();
    source.lastError = null;
    if (source.status === "broken") source.status = "active";
  } else {
    source.failCount += 1;
    source.lastError = (result.error ?? "unknown").slice(0, 400);
    if (source.failCount >= 5) source.status = "broken";
  }
  source.updatedAt = nowIso();
  await redis.set(registrySourceKey(id), JSON.stringify(source), "EX", DEFAULT_TTL_SECONDS);
  return source;
}

export async function proposeCrawlerSource(input: {
  url: string;
  name?: string;
  notes?: string;
}): Promise<{ proposed: boolean; source?: CrawlerSource; reason?: string }> {
  const domain = domainFromUrl(input.url);
  if (!domain) return { proposed: false, reason: "invalid url" };
  const existing = await listCrawlerSources();
  if (existing.some((s) => s.domain === domain)) {
    return { proposed: false, reason: "domain already registered" };
  }
  const source = await upsertCrawlerSource({
    domain,
    name: input.name?.trim() || domain,
    startUrls: [input.url],
    strategy: "listing-links",
    trust: "low",
    status: "proposed",
    notes: input.notes ?? "Auto-proposed from outbound discovery",
    linkPatterns: ["concurso", "edital", "selecao", "processo"],
    openPatterns: ["inscri", "aberto", "edital"],
    politenessMs: 2500,
  });
  return { proposed: true, source };
}

export async function seedCrawlerSources(): Promise<{ seeded: number; total: number }> {
  let seeded = 0;
  const existing = await listCrawlerSources();
  const byDomain = new Set(existing.map((s) => s.domain));
  for (const starter of STARTER_CRAWLER_SOURCES) {
    // Key by domain so English display-name tweaks do not duplicate sources.
    if (byDomain.has(starter.domain)) continue;
    await upsertCrawlerSource(starter);
    byDomain.add(starter.domain);
    seeded += 1;
  }
  const total = (await redis.smembers(registryIndexKey())).length;
  return { seeded, total };
}

export async function upsertOpenExam(
  record: Omit<OpenExamRecord, "id" | "discoveredAt" | "lastSeenAt"> & {
    id?: string;
  },
): Promise<{ record: OpenExamRecord; created: boolean; changed: boolean }> {
  const id =
    record.id ??
    openExamId({
      examSlug: record.examSlug,
      listingUrl: record.listingUrl,
      title: record.title,
    });
  const key = openExamKey(id);
  const existingRaw = await redis.get(key);
  const stamp = nowIso();
  let existing: OpenExamRecord | null = null;
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw) as OpenExamRecord;
    } catch {
      existing = null;
    }
  }

  const nextFp = openExamFingerprint(record);
  const prevFp = existing ? openExamFingerprint(existing) : null;
  const created = !existing;
  const changed = created || prevFp !== nextFp;

  if (!changed && existing) {
    const touched: OpenExamRecord = { ...existing, lastSeenAt: stamp };
    await redis.set(key, JSON.stringify(touched), "EX", DEFAULT_TTL_SECONDS);
    return { record: touched, created: false, changed: false };
  }

  const full: OpenExamRecord = {
    ...record,
    id,
    discoveredAt: existing?.discoveredAt ?? stamp,
    lastSeenAt: stamp,
  };
  await redis
    .pipeline()
    .set(key, JSON.stringify(full), "EX", DEFAULT_TTL_SECONDS)
    .sadd(openExamIndexKey(), id)
    .expire(openExamIndexKey(), DEFAULT_TTL_SECONDS)
    .exec();
  return { record: full, created, changed: true };
}

export async function getSourceListingFingerprint(sourceId: string): Promise<string | null> {
  const raw = await redis.get(sourceListingFingerprintKey(sourceId));
  return raw && raw.length > 0 ? raw : null;
}

export async function setSourceListingFingerprint(
  sourceId: string,
  fingerprint: string,
): Promise<void> {
  await redis.set(
    sourceListingFingerprintKey(sourceId),
    fingerprint,
    "EX",
    DEFAULT_TTL_SECONDS,
  );
}

export async function listOpenExams(limit = 100): Promise<OpenExamRecord[]> {
  const ids = await redis.smembers(openExamIndexKey());
  const take = ids.slice(0, Math.max(1, limit));
  if (take.length === 0) return [];
  const pipeline = redis.pipeline();
  for (const id of take) pipeline.get(openExamKey(id));
  const rows = await pipeline.exec();
  const items: OpenExamRecord[] = [];
  for (const row of rows ?? []) {
    const raw = row?.[1];
    if (typeof raw !== "string" || !raw) continue;
    try {
      const parsed = JSON.parse(raw) as OpenExamRecord & { concursoSlug?: string };
      const examSlug = parsed.examSlug || parsed.concursoSlug;
      if (!examSlug || !parsed.title || !parsed.listingUrl || !parsed.id) continue;
      items.push({
        ...parsed,
        examSlug,
      });
    } catch {
      /* skip */
    }
  }
  return items.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

export async function saveCrawlerRun(summary: CrawlerRunSummary): Promise<void> {
  await redis.set(crawlerLastRunKey(), JSON.stringify(summary), "EX", DEFAULT_TTL_SECONDS);
}

export async function getCrawlerRun(): Promise<CrawlerRunSummary | null> {
  const raw = await redis.get(crawlerLastRunKey());
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CrawlerRunSummary;
  } catch {
    return null;
  }
}

export async function tryAcquireCrawlerLock(ttlSec = 3600): Promise<boolean> {
  const result = await redis.set(crawlerRunLockKey(), nowIso(), "EX", ttlSec, "NX");
  return result === "OK";
}

export async function releaseCrawlerLock(): Promise<void> {
  await redis.del(crawlerRunLockKey());
}

export async function consumeCrawlerForceFlag(): Promise<boolean> {
  const key = "crawl:run:force";
  const raw = await redis.get(key);
  if (!raw) return false;
  await redis.del(key);
  return true;
}


export async function getCrawlerObservability(): Promise<CrawlerObservability> {
  const sources = await listCrawlerSources();
  const openIds = await redis.smembers(openExamIndexKey());
  const lastRun = await getCrawlerRun();
  return {
    lastRun,
    sources: {
      total: sources.length,
      active: sources.filter((s) => s.status === "active").length,
      broken: sources.filter((s) => s.status === "broken").length,
      proposed: sources.filter((s) => s.status === "proposed").length,
      disabled: sources.filter((s) => s.status === "disabled").length,
    },
    openExams: openIds.length,
  };
}
