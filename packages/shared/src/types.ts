export type LevelSlug =
  | "beginner"
  | "novice"
  | "intermediate"
  | "advanced"
  | "pro";

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN";

export type AttemptStatus =
  | "GENERATING"
  | "IN_PROGRESS"
  | "PENDING"
  | "IN_CORRECTION"
  | "CORRECTED";

export type LocaleCode = "en" | "pt-BR";

export type TopicPresetSlug =
  | "concurso"
  | "vestibular"
  | "certificacao"
  | "entrevista"
  | "idioma"
  | "faculdade"
  | "trabalho"
  | "livre";

export type AttachmentKind = "TEXT" | "PDF" | "IMAGE";

export type LinkFetchStatus = "PENDING" | "OK" | "FAILED" | "SKIPPED";

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
  explanation: string | null;
  correctAnswerSummary: string | null;
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
  levelSlug: LevelSlug | "topic";
  levelLabel: string;
  topicId: string | null;
  topicTitle: string | null;
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
  | "difficulty-releveling"
  | "question-generation";

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
  levelSlug: LevelSlug | "topic";
  levelLabel: string;
  locale: LocaleCode;
  questions: ReviewQuestionPayload[];
}

export interface AnswerCorrection {
  questionId: string;
  grade: number;
  comment: string;
  explanation?: string;
  correctAnswerSummary?: string;
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

export interface TopicAttachmentDto {
  id: string;
  kind: AttachmentKind;
  filename: string;
  mimeType: string;
  byteSize: number;
  hasExtractedText: boolean;
  createdAt: string;
}

export interface TopicLinkDto {
  id: string;
  url: string;
  label: string | null;
  fetchStatus: LinkFetchStatus;
  hasFetchedText: boolean;
  createdAt: string;
}

export interface TopicDto {
  id: string;
  title: string;
  guidelines: string;
  presetSlug: TopicPresetSlug | null;
  preferredLocale: LocaleCode | null;
  createdAt: string;
  updatedAt: string;
  attachments: TopicAttachmentDto[];
  links: TopicLinkDto[];
}

export interface TopicListItemDto {
  id: string;
  title: string;
  presetSlug: TopicPresetSlug | null;
  preferredLocale: LocaleCode | null;
  attachmentCount: number;
  linkCount: number;
  updatedAt: string;
}

export interface CreateTopicInput {
  title: string;
  guidelines: string;
  presetSlug?: TopicPresetSlug | null;
  preferredLocale?: LocaleCode | null;
}

export interface UpdateTopicInput {
  title?: string;
  guidelines?: string;
  presetSlug?: TopicPresetSlug | null;
  preferredLocale?: LocaleCode | null;
}

export interface StartPillInput {
  focusText?: string | null;
  locale?: LocaleCode;
}

export interface PillStartResponse {
  attemptId: string;
  status: AttemptStatus;
}

export interface PillAttemptDto {
  attemptId: string;
  status: AttemptStatus;
  topicId: string;
  topicTitle: string;
  focusText: string | null;
  locale: LocaleCode;
  questions: QuizQuestionDto[];
}

export interface GeneratedQuestionInput {
  type: QuestionType;
  prompt: string;
  options: string[] | null;
  correctIndex: number | null;
  referenceAnswer: string | null;
  explanation: string | null;
}

export interface GenerationCompleteInput {
  questions: GeneratedQuestionInput[];
}

export interface PendingGenerationAttempt {
  attemptId: string;
  topicId: string;
  topicTitle: string;
  guidelines: string;
  presetSlug: string | null;
  focusText: string | null;
  locale: LocaleCode;
  hasLinks: boolean;
  materials: {
    attachments: Array<{ filename: string; kind: AttachmentKind; excerpt: string | null }>;
    links: Array<{ url: string; label: string | null; excerpt: string | null }>;
  };
  recentPerformance: Array<{
    score: number | null;
    maxScore: number;
    focusText: string | null;
    correctedAt: string | null;
  }>;
}

export interface TopicPresetDefinition {
  slug: TopicPresetSlug;
  label: Record<LocaleCode, string>;
  guidelinesTemplate: Record<LocaleCode, string>;
  focusExamples: Record<LocaleCode, string[]>;
}
