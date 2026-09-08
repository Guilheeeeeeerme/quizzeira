import {
  OutputPolicyError,
  screenModelStrings,
  type GeneratedQuestionInput,
  type InferredSyllabus,
} from "@quizzeira/shared";

function policyHttpError(err: unknown): never {
  if (err instanceof OutputPolicyError) {
    throw Object.assign(new Error(err.message), { statusCode: 400 });
  }
  throw err;
}

export function screenPersistedStrings(...values: Array<string | null | undefined>): void {
  try {
    screenModelStrings(...values);
  } catch (err) {
    policyHttpError(err);
  }
}

export function screenGeneratedQuestions(questions: GeneratedQuestionInput[]): void {
  for (const q of questions) {
    screenPersistedStrings(
      q.prompt,
      q.explanation,
      q.referenceAnswer,
      ...(q.options ?? []),
      ...(q.promptMedia ?? []).flatMap((m) => [m.url, m.alt]),
      ...(q.optionMedia ?? []).flatMap((row) =>
        (row ?? []).flatMap((m) => [m.url, m.alt]),
      ),
    );
  }
}

export function screenSyllabus(syllabus: InferredSyllabus): void {
  screenPersistedStrings(
    syllabus.styleNotes,
    syllabus.difficultyNotes,
    syllabus.seniority,
    ...syllabus.subjects,
    ...syllabus.materialRoles,
  );
}
