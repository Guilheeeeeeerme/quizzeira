import type { Question } from "@prisma/client";
import type { QuestionMediaRef, QuizQuestionDto } from "@quizzeira/shared";
import { normalizeQuestionPresentation } from "@quizzeira/shared";

function asMediaList(raw: unknown): QuestionMediaRef[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: QuestionMediaRef[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const url = String((item as { url?: unknown }).url ?? "").trim();
    if (!url) continue;
    const alt = String((item as { alt?: unknown }).alt ?? "").trim();
    out.push(alt ? { url, alt } : { url });
  }
  return out.length ? out : undefined;
}

function asOptionMedia(raw: unknown): Array<QuestionMediaRef[] | null> | undefined {
  if (!Array.isArray(raw)) return undefined;
  return raw.map((entry) => {
    const list = asMediaList(entry);
    return list ?? null;
  });
}

export function toQuizQuestionDto(question: Question): QuizQuestionDto {
  const options =
    question.type === "MULTIPLE_CHOICE" && question.options
      ? (question.options as string[])
      : null;
  const normalized = normalizeQuestionPresentation({
    prompt: question.prompt,
    options,
    promptMedia: asMediaList((question as { promptMedia?: unknown }).promptMedia),
    optionMedia: asOptionMedia((question as { optionMedia?: unknown }).optionMedia),
  });

  const dto: QuizQuestionDto = {
    id: question.id,
    type: question.type,
    prompt: normalized.prompt,
  };

  if (question.type === "MULTIPLE_CHOICE" && normalized.options) {
    dto.options = normalized.options;
  }
  if (normalized.promptMedia.length) dto.promptMedia = normalized.promptMedia;
  if (normalized.optionMedia?.some(Boolean)) dto.optionMedia = normalized.optionMedia;

  return dto;
}

export function formatUserResponse(
  question: Question,
  selectedIndex: number | null | undefined,
  openText: string | null | undefined,
): string {
  if (question.type === "OPEN") {
    return openText ?? "";
  }
  const options = (question.options as string[] | null) ?? [];
  if (selectedIndex === null || selectedIndex === undefined) {
    return "";
  }
  return options[selectedIndex] ?? `Option ${selectedIndex + 1}`;
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
