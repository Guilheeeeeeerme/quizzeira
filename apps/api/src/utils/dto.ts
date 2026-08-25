import type { Question } from "@prisma/client";
import type { QuizQuestionDto } from "@quiz-app/shared";

export function toQuizQuestionDto(question: Question): QuizQuestionDto {
  const dto: QuizQuestionDto = {
    id: question.id,
    type: question.type,
    prompt: question.prompt,
  };

  if (question.type === "MULTIPLE_CHOICE" && question.options) {
    dto.options = question.options as string[];
  }

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
