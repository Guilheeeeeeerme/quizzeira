import type {
  GeneratedQuestionInput,
  LocaleCode,
  QuestionBankDepositRequest,
  QuestionBankItem,
  QuestionBankSampleRequest,
  QuestionBankSourceMeta,
  QuestionBankStats,
} from "@quizzeira/shared";
import {
  bankExamIndexKey,
  bankItemId,
  bankItemKey,
  bankSubjectIndexKey,
  slugifyKey,
  toGeneratedQuestion,
} from "@quizzeira/shared";
import { redis } from "../lib/redis";
import { env } from "../lib/env";

function ttlSeconds(): number {
  return Math.max(1, env.questionBankTtlDays) * 24 * 60 * 60;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function touchTtl(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const pipeline = redis.pipeline();
  const ttl = ttlSeconds();
  for (const key of keys) pipeline.expire(key, ttl);
  await pipeline.exec();
}

export async function upsertBankQuestions(
  input: QuestionBankDepositRequest,
): Promise<{ upserted: number; ids: string[] }> {
  const examSlug = slugifyKey(input.examSlug);
  const subjectLabel = input.subject?.trim() || "geral";
  const subjectSlug = slugifyKey(subjectLabel);
  const now = new Date().toISOString();
  const ids: string[] = [];
  const keysTouched = new Set<string>();

  for (const q of input.questions) {
    if (!q.prompt?.trim()) continue;
    if (q.type === "MULTIPLE_CHOICE") {
      if (!Array.isArray(q.options) || q.options.length < 2) continue;
      if (
        q.correctIndex == null ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      ) {
        continue;
      }
    } else if (!q.referenceAnswer?.trim()) {
      continue;
    }

    const id = bankItemId({
      examSlug,
      subjectSlug,
      prompt: q.prompt,
      options: q.options,
    });
    const itemKey = bankItemKey(id);
    const existingRaw = await redis.get(itemKey);
    let createdAt = now;
    if (existingRaw) {
      try {
        const existing = JSON.parse(existingRaw) as QuestionBankItem;
        createdAt = existing.createdAt ?? now;
      } catch {
        /* replace corrupt */
      }
    }

    const item: QuestionBankItem = {
      id,
      examSlug,
      emphasis: input.emphasis?.trim() || null,
      subject: subjectLabel,
      subjectSlug,
      type: q.type,
      prompt: q.prompt.trim(),
      options: q.type === "MULTIPLE_CHOICE" ? (q.options ?? []) : null,
      correctIndex: q.type === "MULTIPLE_CHOICE" ? q.correctIndex : null,
      referenceAnswer: q.type === "OPEN" ? q.referenceAnswer : null,
      explanation: q.explanation?.trim() || null,
      locale: input.locale,
      source: input.source,
      createdAt,
      lastSeenAt: now,
    };

    const subjectKey = bankSubjectIndexKey(examSlug, subjectSlug);
    const examKey = bankExamIndexKey(examSlug);
    const pipeline = redis.pipeline();
    pipeline.set(itemKey, JSON.stringify(item), "EX", ttlSeconds());
    pipeline.sadd(subjectKey, id);
    pipeline.sadd(examKey, id);
    await pipeline.exec();
    keysTouched.add(subjectKey);
    keysTouched.add(examKey);
    ids.push(id);
  }

  await touchTtl([...keysTouched]);
  return { upserted: ids.length, ids };
}

export async function sampleBankQuestions(
  input: QuestionBankSampleRequest,
): Promise<{ questions: GeneratedQuestionInput[]; ids: string[]; hitCount: number }> {
  const examSlug = slugifyKey(input.examSlug);
  const exclude = new Set(input.excludeIds ?? []);
  const limit = Math.max(1, Math.min(input.limit, 40));
  const subjects =
    input.subjects.length > 0 ? input.subjects : ["geral"];

  const idSet = new Set<string>();
  for (const subject of subjects) {
    const subjectKey = bankSubjectIndexKey(examSlug, slugifyKey(subject));
    const ids = await redis.smembers(subjectKey);
    for (const id of ids) {
      if (!exclude.has(id)) idSet.add(id);
    }
  }

  // Fallback: any item for this exam when subject indexes are empty.
  if (idSet.size === 0) {
    const ids = await redis.smembers(bankExamIndexKey(examSlug));
    for (const id of ids) {
      if (!exclude.has(id)) idSet.add(id);
    }
  }

  const pickedIds = shuffle([...idSet]).slice(0, limit);
  if (pickedIds.length === 0) {
    return { questions: [], ids: [], hitCount: 0 };
  }

  const pipeline = redis.pipeline();
  for (const id of pickedIds) pipeline.get(bankItemKey(id));
  const rows = await pipeline.exec();
  const questions: GeneratedQuestionInput[] = [];
  const ids: string[] = [];
  const now = new Date().toISOString();

  for (let i = 0; i < pickedIds.length; i += 1) {
    const raw = rows?.[i]?.[1];
    if (typeof raw !== "string" || !raw) continue;
    try {
      const item = JSON.parse(raw) as QuestionBankItem;
      if (input.locale && item.locale !== input.locale) continue;
      questions.push(toGeneratedQuestion(item));
      ids.push(item.id);
      item.lastSeenAt = now;
      await redis.set(bankItemKey(item.id), JSON.stringify(item), "EX", ttlSeconds());
    } catch {
      /* skip */
    }
  }

  return { questions, ids, hitCount: questions.length };
}

export async function getQuestionBankStats(examSlug: string): Promise<QuestionBankStats> {
  const slug = slugifyKey(examSlug);
  const ids = await redis.smembers(bankExamIndexKey(slug));
  const bySubject: Record<string, number> = {};
  let total = 0;

  if (ids.length === 0) {
    return { examSlug: slug, total: 0, bySubject };
  }

  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.get(bankItemKey(id));
  const rows = await pipeline.exec();
  for (const row of rows ?? []) {
    const raw = row?.[1];
    if (typeof raw !== "string" || !raw) continue;
    try {
      const item = JSON.parse(raw) as QuestionBankItem;
      total += 1;
      bySubject[item.subjectSlug] = (bySubject[item.subjectSlug] ?? 0) + 1;
    } catch {
      /* skip */
    }
  }

  return { examSlug: slug, total, bySubject };
}

export async function listQuestionBankExamSlugs(limit = 50): Promise<string[]> {
  const keys = await redis.keys("qbank:exam:*");
  return keys
    .map((k) => k.replace(/^qbank:exam:/, ""))
    .filter(Boolean)
    .slice(0, limit);
}

export async function storeBankSource(meta: QuestionBankSourceMeta & { snippet?: string }): Promise<void> {
  if (!meta.urlHash) return;
  const key = `qbank:source:${meta.urlHash}`;
  await redis.set(
    key,
    JSON.stringify({ ...meta, storedAt: new Date().toISOString() }),
    "EX",
    ttlSeconds(),
  );
}

export type { LocaleCode, QuestionBankSourceMeta };
