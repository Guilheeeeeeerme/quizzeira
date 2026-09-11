import type { LocaleCode, TopicDto, TopicListItemDto, TopicPresetSlug, CreateTopicInput, UpdateTopicInput } from "@quizzeira/shared";
import { isTopicPresetSlug } from "@quizzeira/shared";
import { prisma } from "../lib/prisma";

export const TOPIC_TTL_DAYS = 30;

export async function touchTopicLastUsed(topicId: string): Promise<void> {
  await prisma.topic.update({
    where: { id: topicId },
    data: { lastUsedAt: new Date() },
  });
}

export async function purgeTopicById(topicId: string): Promise<void> {
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
}): TopicDto {
  return {
    id: topic.id,
    title: topic.title,
    guidelines: topic.guidelines,
    presetSlug: (topic.presetSlug as TopicPresetSlug | null) ?? null,
    preferredLocale: (topic.preferredLocale as LocaleCode | null) ?? null,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  };
}

async function loadTopic(userId: string, topicId: string) {
  const topic = await prisma.topic.findFirst({
    where: { id: topicId, userId },
  });
  if (!topic) {
    throw Object.assign(new Error("Topic not found"), { statusCode: 404 });
  }
  return topic;
}

export async function listTopics(userId: string): Promise<TopicListItemDto[]> {
  const topics = await prisma.topic.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return topics.map((t) => ({
    id: t.id,
    title: t.title,
    presetSlug: (t.presetSlug as TopicPresetSlug | null) ?? null,
    preferredLocale: (t.preferredLocale as LocaleCode | null) ?? null,
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
      ...((input.guidelines !== undefined || input.presetSlug !== undefined) && {
      }),
      lastUsedAt: new Date(),
    },
  });
  return toTopicDto(topic);
}

export async function deleteTopic(userId: string, topicId: string): Promise<void> {
  await loadTopic(userId, topicId);
  await purgeTopicById(topicId);
}
