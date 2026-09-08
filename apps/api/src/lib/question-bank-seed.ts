import type { LocaleCode } from "@quizzeira/shared";
import { upsertBankQuestions } from "../services/question-bank.store";
import { appendExamActivity } from "../services/exam-activity.service";
import { TRANSPETRO_ADMIN_2023_SEED } from "./question-bank-seed-data";

const EXAM_SLUGS = ["transpetro-cesgranrio", "transpetro"] as const;

/**
 * Load curated past-exam MCQs into Redis question bank (idempotent upsert by prompt hash).
 * Called from catalog seed so Open exams already show bank counts locally.
 */
export async function seedPastExamQuestionBank(locale: LocaleCode = "pt"): Promise<{
  examSlugs: string[];
  upserted: number;
}> {
  let upserted = 0;
  for (const examSlug of EXAM_SLUGS) {
    const bySubject = new Map<string, typeof TRANSPETRO_ADMIN_2023_SEED>();
    for (const q of TRANSPETRO_ADMIN_2023_SEED) {
      const list = bySubject.get(q.subject) ?? [];
      list.push(q);
      bySubject.set(q.subject, list);
    }
    for (const [subject, questions] of bySubject) {
      const result = await upsertBankQuestions({
        examSlug,
        emphasis: "Administração",
        subject,
        locale,
        source: {
          kind: "past_exam",
          title: "Transpetro PSP Terra Superior 2023.2 — Administração (PCI / Cesgranrio)",
          url: "https://www.pciconcursos.com.br/provas/",
          fetchedAt: new Date().toISOString(),
        },
        questions: questions.map(({ subject: _s, ...q }) => q),
      });
      upserted += result.upserted;
    }
    await appendExamActivity({
      examSlug,
      status: "success",
      step: "question_bank",
      title: "Past-exam seed loaded",
      message: `Seeded ${TRANSPETRO_ADMIN_2023_SEED.length} curated MCQs from Transpetro 2023.2 Administração + official gabarito (PCI Concursos).`,
    }).catch(() => undefined);
  }
  return { examSlugs: [...EXAM_SLUGS], upserted };
}
