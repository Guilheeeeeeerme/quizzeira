import type { ExamCatalogItemDto, ExamPrepareResponse, LocaleCode } from "@quizzeira/shared";
import { getTopicPreset } from "@quizzeira/shared";
import { fetchOpenExams, publishedExamCounts } from "../lib/pipeline-clients";
import { createTopic, listTopics } from "./topic.service";
import { prisma } from "../lib/prisma";
export { assertOpenExamOnlyPreset, catalogSlugHint } from "../lib/exam-product";

const SLUG_MARKER = "examSlug:";
const ID_MARKER = "openExamId:";

/**
 * Catalog = open exams from discovery-api, annotated with published counts from
 * content-api. The study API owns neither side, so both degrade to empty.
 */
export async function listExamCatalog(): Promise<ExamCatalogItemDto[]> {
  const [open, stats] = await Promise.all([fetchOpenExams(100), publishedExamCounts()]);

  // Certifications, vestibulares and other non-concurso listings never reach
  // the study catalog (spec §11.2 item 5; screenshots #2 and #6).
  const studyEligible = open.filter((o) => (o.kind ?? "concurso") === "concurso" || o.kind === "oab");
  const items: ExamCatalogItemDto[] = studyEligible.map((o) => {
    const published = stats.get(o.examSlug);
    return {
      id: o.id,
      examSlug: o.examSlug,
      title: o.title,
      org: o.org,
      banca: o.banca,
      kind: o.kind ?? "concurso",
      positions: o.positions ?? [],
      editalUrl: o.editalUrl,
      listingUrl: o.listingUrl,
      status: o.status,
      sourceDomain: o.sourceDomain,
      placeholder: false,
      bankQuestionCount: published?.publishedCount ?? 0,
      bankReady: published?.bankReady ?? false,
    };
  });

  return items.sort((a, b) => {
    if (a.bankReady !== b.bankReady) return a.bankReady ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export async function getExamCatalogItem(id: string): Promise<ExamCatalogItemDto> {
  const items = await listExamCatalog();
  const hit = items.find((i) => i.id === id || i.examSlug === id);
  if (!hit) {
    throw Object.assign(new Error("Exam not found"), { statusCode: 404 });
  }
  return hit;
}

function buildGuidelines(item: ExamCatalogItemDto, locale: LocaleCode): string {
  const template = getTopicPreset("open_exam")!.guidelinesTemplate[locale];
  const orgLine = item.org ?? item.title;
  const emphasis = item.positions[0] ?? "";
  const banca = item.banca ?? "";
  const filled = template
    .replace(/(Órgão \/ concurso:|Exam \/ agency:).*/i, `$1 ${orgLine}`)
    .replace(
      /(Cargo \/ vaga \/ ênfase[^:]*:|Target role \/ vacancy \/ emphasis[^:]*:).*/i,
      `$1 ${emphasis}`,
    )
    .replace(/(Estilo da banca:|Bank \/ exam style notes:).*/i, `$1 ${banca}`);
  return [
    filled.trim(),
    "",
    `${SLUG_MARKER} ${item.examSlug}`,
    `${ID_MARKER} ${item.id}`,
    item.editalUrl ? `editalUrl: ${item.editalUrl}` : null,
    item.listingUrl ? `listingUrl: ${item.listingUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Read back the exam a study topic was prepared for. */
export function examSlugFromGuidelines(guidelines: string): string | null {
  const match = guidelines.match(new RegExp(`^\\s*${SLUG_MARKER}\\s*(\\S+)\\s*$`, "m"));
  return match?.[1]?.trim() || null;
}

export async function prepareExamStudy(
  userId: string,
  examId: string,
  locale: LocaleCode = "pt",
): Promise<ExamPrepareResponse> {
  const exam = await getExamCatalogItem(examId);
  const marker = `${SLUG_MARKER} ${exam.examSlug}`;

  const existing = await prisma.topic.findFirst({
    where: {
      userId,
      presetSlug: "open_exam",
      guidelines: { contains: marker },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    await prisma.topic.update({
      where: { id: existing.id },
      data: { lastUsedAt: new Date(), preferredLocale: locale },
    });
    return { topicId: existing.id, exam, created: false };
  }

  const topic = await createTopic(userId, {
    title: exam.title.slice(0, 180),
    guidelines: buildGuidelines(exam, locale),
    presetSlug: "open_exam",
    preferredLocale: locale,
  });

  return { topicId: topic.id, exam, created: true };
}

export async function listUserExamTopics(userId: string) {
  const topics = await listTopics(userId);
  return topics.filter((t) => t.presetSlug === "open_exam" || t.presetSlug == null);
}
