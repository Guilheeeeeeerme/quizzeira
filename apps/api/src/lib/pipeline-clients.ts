// Concept: Sampling (not RAG) — the study API's only links to the pipeline.
//
// Study reads from two upstreams and writes to neither's domain state:
//   discovery-api → which exams exist (Source registry / Ingestion)
//   content-api   → published questions only (Question bank)
//
// Both are treated as optional: if a stack is down the catalog degrades to
// empty and a pill start fails with a clear message, rather than 500ing.
import type { GeneratedQuestionInput, LocaleCode, OpenExamRecord } from "@quizzeira/shared";
import { env } from "./env";

/** Published questions below this count keep an exam flagged "not ready". */
export const BANK_READY_THRESHOLD = 5;

async function serviceFetch<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-key": apiKey,
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(env.serviceFetchTimeoutMs),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Object.assign(
      new Error(text.slice(0, 200) || `${path} ${res.status}`),
      { statusCode: res.status },
    );
  }
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export function discoveryFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return serviceFetch<T>(env.discoveryApiUrl, env.discoveryInternalKey, path, init);
}

export function contentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return serviceFetch<T>(env.contentApiUrl, env.contentInternalKey, path, init);
}

// ── Discovery reads ─────────────────────────────────────────────────────────

export async function fetchOpenExams(limit = 100): Promise<OpenExamRecord[]> {
  try {
    const data = await discoveryFetch<{ items?: OpenExamRecord[] }>("/internal/open-exams");
    return (data.items ?? []).slice(0, limit);
  } catch {
    return [];
  }
}

export async function fetchOpenExam(id: string): Promise<OpenExamRecord | null> {
  const items = await fetchOpenExams(200);
  return items.find((i) => i.id === id || i.examSlug === id) ?? null;
}

// ── Content reads ───────────────────────────────────────────────────────────

export interface PublishedExamCount {
  publishedCount: number;
  bankReady: boolean;
}

/** Published-question counts per exam slug, used to annotate the catalog. */
export async function publishedExamCounts(): Promise<Map<string, PublishedExamCount>> {
  const out = new Map<string, PublishedExamCount>();
  try {
    const data = await contentFetch<{
      exams?: Array<{ examSlug: string; published: number }>;
    }>("/published/stats");
    for (const row of data.exams ?? []) {
      out.set(row.examSlug, {
        publishedCount: row.published,
        bankReady: row.published >= BANK_READY_THRESHOLD,
      });
    }
  } catch {
    // Content down: every exam reads as "not ready", which is the truth from
    // the learner's point of view.
  }
  return out;
}

/**
 * Sample published questions for one attempt. This is Sampling, not RAG: the
 * questions already exist and passed the publish gate, so there is no
 * retrieval or generation on the request path.
 */
export async function samplePublishedForAttempt(input: {
  examSlug: string;
  locale: LocaleCode;
  limit: number;
  subjects?: string[];
  syllabusNodeIds?: string[];
  excludeIds?: string[];
}): Promise<GeneratedQuestionInput[]> {
  try {
    const data = await contentFetch<{ questions?: GeneratedQuestionInput[] }>(
      "/published/sample",
      {
        method: "POST",
        body: JSON.stringify({
          examSlug: input.examSlug,
          subjects: input.subjects ?? [],
          syllabusNodeIds: input.syllabusNodeIds ?? [],
          locale: input.locale,
          limit: input.limit,
          excludeIds: input.excludeIds ?? [],
        }),
      },
    );
    return data.questions ?? [];
  } catch {
    return [];
  }
}

/** Active syllabus tree for study focus picker (§37). */
export async function fetchPublishedSyllabus(examSlug: string): Promise<{
  examSlug: string;
  syllabus: { id: string; version: number; status: string } | null;
  positions: Array<{ id: string; title: string; slug: string }>;
  nodes: Array<{
    id: string;
    parentId: string | null;
    depth: number;
    title: string;
    pathSlug: string;
    scope: string | null;
  }>;
}> {
  return contentFetch(`/published/exams/${encodeURIComponent(examSlug)}/syllabus`);
}
