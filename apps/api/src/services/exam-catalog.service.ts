import type { ExamCatalogItemDto, ExamPrepareResponse, LocaleCode } from "@quizzeira/shared";
import { getTopicPreset } from "@quizzeira/shared";
import {
  listOpenExams,
  seedCrawlerSources,
  upsertOpenExam,
} from "./crawler-registry.store";
import { getQuestionBankStats } from "./question-bank.store";
import { createTopic, listTopics } from "./topic.service";
import { prisma } from "../lib/prisma";
import { STARTER_DISCOVERY_ORGS } from "../lib/crawler-seed";
export { assertOpenExamOnlyPreset, catalogSlugHint } from "../lib/exam-product";

const SLUG_MARKER = "examSlug:";
const ID_MARKER = "openExamId:";

/** Seed catalog rows (fixture / cold start). Merged with discovery-org seeds. */
const PLACEHOLDER_EXAMS: Array<
  Omit<ExamCatalogItemDto, "bankQuestionCount" | "bankReady">
> = [
  {
    id: "placeholder-transpetro-cesgranrio",
    examSlug: "transpetro-cesgranrio",
    title: "Transpetro — PSP Terra (Superior) — Cesgranrio",
    org: "Transpetro",
    banca: "Cesgranrio",
    emphasis: ["Administração", "Engenharia"],
    editalUrl: null,
    listingUrl: "https://www.cesgranrio.org.br/concursos/",
    status: "open",
    sourceDomain: "cesgranrio.org.br",
    placeholder: true,
  },
  {
    id: "placeholder-bb-cesgranrio",
    examSlug: "banco-do-brasil-cesgranrio",
    title: "Banco do Brasil — Escriturário (placeholder)",
    org: "Banco do Brasil",
    banca: "Cesgranrio",
    emphasis: ["Conhecimentos bancários"],
    editalUrl: null,
    listingUrl: "https://www.cesgranrio.org.br/concursos/",
    status: "open",
    sourceDomain: "cesgranrio.org.br",
    placeholder: true,
  },
  {
    id: "placeholder-caixa-cesgranrio",
    examSlug: "caixa-cesgranrio",
    title: "Caixa Econômica Federal — Técnico Bancário (placeholder)",
    org: "Caixa",
    banca: "Cesgranrio",
    emphasis: ["Atendimento", "Conhecimentos bancários"],
    editalUrl: null,
    listingUrl: "https://www.cesgranrio.org.br/concursos/",
    status: "open",
    sourceDomain: "cesgranrio.org.br",
    placeholder: true,
  },
  {
    id: "placeholder-correios",
    examSlug: "correios",
    title: "Correios — open exam (placeholder)",
    org: "Correios",
    banca: null,
    emphasis: ["Conhecimentos gerais", "Português"],
    editalUrl: null,
    listingUrl: "https://www.correios.com.br/",
    status: "open",
    sourceDomain: "correios.com.br",
    placeholder: true,
  },
  {
    id: "placeholder-marinha-ot",
    examSlug: "marinha-oficial-temporario",
    title: "Marinha — Oficial Temporário (OT) (placeholder)",
    org: "Marinha do Brasil",
    banca: null,
    emphasis: ["Conhecimentos navais", "Português"],
    editalUrl: null,
    listingUrl: "https://www.marinha.mil.br/",
    status: "open",
    sourceDomain: "marinha.mil.br",
    placeholder: true,
  },
  {
    id: "placeholder-ibamsp",
    examSlug: "ibamsp",
    title: "IBAMSP — public exam listings (placeholder)",
    org: "IBAMSP",
    banca: "IBAMSP",
    emphasis: ["Administração pública"],
    editalUrl: null,
    listingUrl: "https://www.ibamsp-concursos.org.br/informacoes/179/",
    status: "open",
    sourceDomain: "ibamsp-concursos.org.br",
    placeholder: true,
  },
  ...STARTER_DISCOVERY_ORGS.filter(
    (d) =>
      ![
        "transpetro",
        "banco-do-brasil",
        "caixa-economica",
        "correios",
        "marinha-oficial-temporario",
      ].includes(d.examSlug),
  ).map((d) => ({
    id: `placeholder-${d.examSlug}`,
    examSlug: d.examSlug,
    title: `${d.title} (placeholder)`,
    org: d.org,
    banca: null as string | null,
    emphasis: d.emphasis,
    editalUrl: null as string | null,
    listingUrl: `https://www.google.com/search?q=${encodeURIComponent(d.searchQueries[0] ?? d.org)}`,
    status: "open" as const,
    sourceDomain: "discovery.seed",
    placeholder: true as const,
  })),
];

async function withBankStats(
  item: Omit<ExamCatalogItemDto, "bankQuestionCount" | "bankReady">,
): Promise<ExamCatalogItemDto> {
  const stats = await getQuestionBankStats(item.examSlug);
  return {
    ...item,
    bankQuestionCount: stats.total,
    bankReady: stats.total >= 3,
  };
}

async function upsertPlaceholder(
  p: Omit<ExamCatalogItemDto, "bankQuestionCount" | "bankReady">,
): Promise<void> {
  await upsertOpenExam({
    id: p.id,
    examSlug: p.examSlug,
    title: p.title,
    org: p.org,
    banca: p.banca,
    emphasis: p.emphasis,
    editalUrl: p.editalUrl,
    listingUrl: p.listingUrl ?? `https://${p.sourceDomain ?? "example.com"}/`,
    status: p.status,
    sourceId: `placeholder:${p.examSlug}`,
    sourceDomain: p.sourceDomain ?? "placeholder.local",
  });
}

/** Upsert missing seed rows so new orgs appear even if Redis already has older opens. */
export async function ensureCatalogSeeded(): Promise<void> {
  await seedCrawlerSources();
  const open = await listOpenExams(200);
  const have = new Set(open.map((o) => o.examSlug));
  for (const p of PLACEHOLDER_EXAMS) {
    if (have.has(p.examSlug)) continue;
    // Also skip if a richer slug already covers the same org prefix (e.g. banco-do-brasil-cesgranrio).
    const covered = [...have].some(
      (slug) => slug === p.examSlug || slug.startsWith(`${p.examSlug}-`),
    );
    if (covered) continue;
    await upsertPlaceholder(p);
    have.add(p.examSlug);
  }
}

export async function listExamCatalog(): Promise<ExamCatalogItemDto[]> {
  await ensureCatalogSeeded();
  const open = await listOpenExams(100);
  const fromCrawler = await Promise.all(
    open.map((o) =>
      withBankStats({
        id: o.id,
        examSlug: o.examSlug,
        title: o.title,
        org: o.org,
        banca: o.banca,
        emphasis: o.emphasis,
        editalUrl: o.editalUrl,
        listingUrl: o.listingUrl,
        status: o.status,
        sourceDomain: o.sourceDomain,
        placeholder: o.sourceId.startsWith("placeholder:"),
      }),
    ),
  );

  if (fromCrawler.length > 0) {
    return fromCrawler.sort((a, b) => {
      if (a.bankReady !== b.bankReady) return a.bankReady ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
  }

  return Promise.all(PLACEHOLDER_EXAMS.map(withBankStats));
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
  const emphasis = item.emphasis[0] ?? "";
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
