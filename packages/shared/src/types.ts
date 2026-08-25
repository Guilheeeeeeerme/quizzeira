export type LevelSlug =
  | "beginner"
  | "novice"
  | "intermediate"
  | "advanced"
  | "pro";

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN";

export type AttemptStatus =
  | "IN_PROGRESS"
  | "PENDING"
  | "IN_CORRECTION"
  | "CORRECTED";

export interface UserDto {
  id: string;
  email: string;
  displayName: string | null;
}

export interface LevelDto {
  id: number;
  slug: LevelSlug;
  label: string;
  sortOrder: number;
}

export interface QuizQuestionDto {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
}

export interface SubmitAnswer {
  questionId: string;
  selectedIndex?: number;
  openText?: string;
}

export interface QuizStartResponse {
  attemptId: string;
  questions: QuizQuestionDto[];
}

export interface QuizSubmitResponse {
  attemptId: string;
  status: AttemptStatus;
}

export interface QuizResultsAnswerDto {
  questionId: string;
  prompt: string;
  type: QuestionType;
  userResponse: string;
  grade: number | null;
  comment: string | null;
}

export interface QuizResultsDto {
  attemptId: string;
  status: AttemptStatus;
  score: number | null;
  maxScore: number;
  generalComment: string | null;
  answers: QuizResultsAnswerDto[];
}

export interface ProgressItemDto {
  attemptId: string;
  levelSlug: LevelSlug;
  levelLabel: string;
  status: AttemptStatus;
  score: number | null;
  maxScore: number;
  startedAt: string;
  submittedAt: string | null;
  correctedAt: string | null;
}

export interface ProgressSummaryDto {
  levelSlug: LevelSlug;
  levelLabel: string;
  attemptCount: number;
  bestScore: number | null;
  lastScore: number | null;
}
