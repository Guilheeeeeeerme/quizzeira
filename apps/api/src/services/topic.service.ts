import { randomUUID } from "crypto";
import { LinkFetchStatus } from "@prisma/client";
import type {
  CreateTopicInput,
  LocaleCode,
  TopicDto,
  TopicListItemDto,
  TopicPresetSlug,
  UpdateTopicInput,
} from "@quizzeira/shared";
import { isTopicPresetSlug } from "@quizzeira/shared";
import { prisma } from "../lib/prisma";
import { fetchUrlText } from "../lib/fetch-url";
import {
  attachmentKindFromMime,
  extractAndStoreAttachmentText,
} from "../lib/extract-text";
import { putObject, deleteObject, getObjectBuffer } from "../lib/storage";

export const TOPIC_TTL_DAYS = 30;

export async function touchTopicLastUsed(topicId: string): Promise<void> {
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date() },
  });
}

/** Delete topic and all related attempts, questions, attachments (S3 best-effort). */
export async function purgeTopicById(topicId: string): Promise<void> {
  const attachments = await prisma.topicAttachment.findMany({
    where: { topicId },
    select: { storageKey: true },
  });
  const attempts = await prisma.quizAttempt.findMany({
    where: { topicId },
    select: { id: true },
  });
  const attemptIds = attempts.map((a) => a.id);
  const questions = await prisma.question.findMany({
    where: { topicId },
    select: { id: true },
  });
  const questionIds = questions.map((q) => q.id);

  await prisma.$transaction(async (tx) => {
    if (attemptIds.length) {
      await tx.quizAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await tx.attemptQuestion.deleteMany({ where: { attemptId: { in: attemptIds } } });
      await tx.quizAttempt.deleteMany({ where: { id: { in: attemptIds } } });
    }
    if (questionIds.length) {
      await tx.attemptQuestion.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.quizAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
      await tx.question.deleteMany({ where: { id: { in: questionIds } } });
    }
    await tx.topic.delete({ where: { id: topicId } });
  });

  await Promise.all(attachments.map((a) => deleteObject(a.storageKey)));
}

export async function purgeStaleTopics(
  olderThanDays = TOPIC_TTL_DAYS,
): Promise<{ deleted: number }> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const stale = await prisma.topic.findMany({
    where: { lastUsedAt: { lt: cutoff } },
    select: { id: true },
    take: 50,
  });
  for (const topic of stale) {
    await purgeTopicById(topic.id);
  }
  return { deleted: stale.length };
}

function toTopicDto(topic: {
  id: string;
  title: string;
  guidelines: string;
  presetSlug: string | null;
  preferredLocale: string | null;
  createdAt: Date;
  updatedAt: Date;
  attachments: Array<{
    id: string;
    kind: "TEXT" | "PDF" | "IMAGE";
    filename: string;
    mimeType: string;
    byteSize: number;
    extractedText: string | null;
    createdAt: Date;
  }>;
  links: Array<{
    id: string;
    url: string;
    label: string | null;
    fetchStatus: LinkFetchStatus;
    fetchedText: string | null;
    createdAt: Date;
  }>;
}): TopicDto {
  return {
    id: topic.id,
    title: topic.title,
    guidelines: topic.guidelines,
    presetSlug: (topic.presetSlug as TopicPresetSlug | null) ?? null,
    preferredLocale: (topic.preferredLocale as LocaleCode | null) ?? null,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    attachments: topic.attachments.map((a) => ({
      id: a.id,
      kind: a.kind,
      filename: a.filename,
      mimeType: a.mimeType,
      byteSize: a.byteSize,
      hasExtractedText: Boolean(a.extractedText),
      createdAt: a.createdAt.toISOString(),
    })),
    links: topic.links.map((l) => ({
      id: l.id,
      url: l.url,
      label: l.label,
      fetchStatus: l.fetchStatus,
      hasFetchedText: Boolean(l.fetchedText),
      createdAt: l.createdAt.toISOString(),
    })),
  };
}

async function loadTopic(userId: string, topicId: string) {
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      links: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!topic) {
    throw Object.assign(new Error("Topic not found"), { statusCode: 404 });
  }
  return topic;
}

export async function listTopics(userId: string): Promise<TopicListItemDto[]> {
  const topics = await prisma.topic.findMany({
    where: { userId },
    include: {
      _count: { select: { attachments: true, links: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    presetSlug: (t.presetSlug as TopicPresetSlug | null) ?? null,
    preferredLocale: (t.preferredLocale as LocaleCode | null) ?? null,
    attachmentCount: t._count.attachments,
    linkCount: t._count.links,
    updatedAt: t.updatedAt.toISOString(),
  }));
}

export async function getTopic(userId: string, topicId: string): Promise<TopicDto> {
  return toTopicDto(await loadTopic(userId, topicId));
}

export async function createTopic(userId: string, input: CreateTopicInput): Promise<TopicDto> {
  const title = input.title?.trim();
  const guidelines = input.guidelines?.trim();
  if (!title || !guidelines) {
    throw Object.assign(new Error("title and guidelines required"), { statusCode: 400 });
  }
  if (input.presetSlug && !isTopicPresetSlug(input.presetSlug)) {
    throw Object.assign(new Error("Invalid presetSlug"), { statusCode: 400 });
  }
  const topic = await prisma.topic.create({
    data: {
      userId,
      title,
      guidelines,
      presetSlug: input.presetSlug ?? null,
      preferredLocale: input.preferredLocale ?? null,
      lastUsedAt: new Date(),
    },
    include: {
      attachments: true,
      links: true,
    },
  });
  return toTopicDto(topic);
}

export async function updateTopic(
  userId: string,
  topicId: string,
  input: UpdateTopicInput,
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  if (input.presetSlug !== undefined && input.presetSlug !== null && !isTopicPresetSlug(input.presetSlug)) {
    throw Object.assign(new Error("Invalid presetSlug"), { statusCode: 400 });
  }
  const topic = await prisma.topic.update({
    where: { id: topicId },
    data: {
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.guidelines !== undefined ? { guidelines: input.guidelines.trim() } : {}),
      ...(input.presetSlug !== undefined ? { presetSlug: input.presetSlug } : {}),
      ...(input.preferredLocale !== undefined ? { preferredLocale: input.preferredLocale } : {}),
      // Guidelines/preset shape the study plan — force re-inference next generation.
      ...((input.guidelines !== undefined || input.presetSlug !== undefined) && {
        inferredSyllabus: null,
      }),
      lastUsedAt: new Date(),
    },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      links: { orderBy: { createdAt: "asc" } },
    },
  });
  return toTopicDto(topic);
}

export async function deleteTopic(userId: string, topicId: string): Promise<void> {
  await loadTopic(userId, topicId);
  await purgeTopicById(topicId);
}

export async function addTopicLink(
  userId: string,
  topicId: string,
  url: string,
  label?: string | null,
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error("Invalid URL"), { statusCode: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw Object.assign(new Error("URL must be http(s)"), { statusCode: 400 });
  }

  const link = await prisma.topicLink.create({
    data: {
      topicId,
      url: parsed.toString(),
      label: label?.trim() || null,
      fetchStatus: LinkFetchStatus.PENDING,
    },
  });

  const fetched = await fetchUrlText(link.url);
  await prisma.topicLink.update({
    where: { id: link.id },
    data: {
      fetchedText: fetched.text,
      fetchStatus: fetched.ok ? LinkFetchStatus.OK : LinkFetchStatus.FAILED,
    },
  });
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date(), inferredSyllabus: null },
  });

  return getTopic(userId, topicId);
}

export async function deleteTopicLink(
  userId: string,
  topicId: string,
  linkId: string,
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  const result = await prisma.topicLink.deleteMany({ where: { id: linkId, topicId } });
  if (result.count === 0) {
    throw Object.assign(new Error("Link not found"), { statusCode: 404 });
  }
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date(), inferredSyllabus: null },
  });
  return getTopic(userId, topicId);
}

export async function addTopicAttachment(
  userId: string,
  topicId: string,
  file: { filename: string; mimeType: string; buffer: Buffer },
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  if (!file.buffer.length) {
    throw Object.assign(new Error("Empty file"), { statusCode: 400 });
  }
  if (file.buffer.length > 20 * 1024 * 1024) {
    throw Object.assign(new Error("File too large (max 20MB)"), { statusCode: 400 });
  }

  const kind = attachmentKindFromMime(file.mimeType, file.filename);
  const storageKey = `topics/${topicId}/${randomUUID()}-${file.filename.replace(/[^\w.\-]+/g, "_")}`;
  await putObject(storageKey, file.buffer, file.mimeType || "application/octet-stream");
  const extractedText = await extractAndStoreAttachmentText(
    kind,
    file.buffer,
    file.mimeType,
  );

  await prisma.topicAttachment.create({
    data: {
      topicId,
      kind,
      filename: file.filename,
      storageKey,
      mimeType: file.mimeType || "application/octet-stream",
      extractedText,
      byteSize: file.buffer.length,
    },
  });
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date(), inferredSyllabus: null },
  });

  return getTopic(userId, topicId);
}

/** Re-run PDF/text extraction with current study-context rules; clears inferredSyllabus. */
export async function refreshTopicAttachmentExtractions(
  userId: string,
  topicId: string,
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  const attachments = await prisma.topicAttachment.findMany({ where: { topicId } });
  for (const attachment of attachments) {
    const buffer = await getObjectBuffer(attachment.storageKey);
    const extractedText = await extractAndStoreAttachmentText(
      attachment.kind,
      buffer,
      attachment.mimeType,
    );
    await prisma.topicAttachment.update({
      where: { id: attachment.id },
      data: { extractedText },
    });
  }
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date(), inferredSyllabus: null },
  });
  return getTopic(userId, topicId);
}

export async function deleteTopicAttachment(
  userId: string,
  topicId: string,
  attachmentId: string,
): Promise<TopicDto> {
  await loadTopic(userId, topicId);
  const result = await prisma.topicAttachment.deleteMany({
    where: { id: attachmentId, topicId },
  });
  if (result.count === 0) {
    throw Object.assign(new Error("Attachment not found"), { statusCode: 404 });
  }
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date(), inferredSyllabus: null },
  });
  return getTopic(userId, topicId);
}
