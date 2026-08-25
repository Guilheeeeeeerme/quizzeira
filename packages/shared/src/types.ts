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

export type PromptKey =
  | "quiz-correction"
  | "question-modernization"
  | "difficulty-releveling";

export interface PromptRecord {
  key: PromptKey;
  version: number;
  body: string;
  updatedAt: string;
  note?: string;
}

export interface ReviewQuestionPayload {
  questionId: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  selectedIndex: number | null;
  openText: string | null;
}

export interface PendingReviewAttempt {
  attemptId: string;
  levelSlug: LevelSlug;
  levelLabel: string;
  questions: ReviewQuestionPayload[];
}

export interface AnswerCorrection {
  questionId: string;
  grade: number;
  comment: string;
  isCorrect: boolean;
}

export interface AttemptCorrectionInput {
  answers: AnswerCorrection[];
  generalComment: string;
}

export interface QuestionPerformance {
  answerCount: number;
  gradedCount: number;
  correctCount: number;
  correctRate: number | null;
  avgGrade: number | null;
}

export interface QuestionUpdateCandidate {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
  levelSlug: LevelSlug;
  levelLabel: string;
  levels: LevelDto[];
  performance: QuestionPerformance;
  lastReviewedAt: string | null;
}

export interface QuestionUpdateInput {
  prompt?: string;
  options?: string[] | null;
  correctIndex?: number | null;
  referenceAnswer?: string | null;
  explanation?: string | null;
  levelSlug?: LevelSlug;
  isActive?: boolean;
}
