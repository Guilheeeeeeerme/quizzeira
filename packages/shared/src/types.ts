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

export type LocaleCode = "en" | "pt";

/** Normalize Accept-Language / stored values; default and fallback is Portuguese. */
export function normalizeLocale(value: string | null | undefined): LocaleCode {
  if (!value) return "pt";
  const raw = value.trim().toLowerCase();
  if (raw === "en" || raw.startsWith("en-")) return "en";
  if (raw === "pt" || raw === "pt-br" || raw.startsWith("pt")) return "pt";
  return "pt";
}

export type TopicPresetSlug =
  | "open_exam"
  | "vestibular"
  | "certificacao"
  | "entrevista"
  | "idioma"
  | "faculdade"
  | "trabalho"
  | "livre";

export type AttachmentKind = "TEXT" | "PDF" | "IMAGE";

export type LinkFetchStatus = "PENDING" | "OK" | "FAILED" | "SKIPPED";

export type UserRole = "USER" | "ADMIN";

export type ProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface UserDto {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
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
  | "question-generation"
  | "topic-inference";

export const SESSION_DURATION_MINUTES = [15, 20, 30, 45, 60, 90] as const;
export type SessionDurationMinutes = (typeof SESSION_DURATION_MINUTES)[number];

export function isSessionDurationMinutes(value: unknown): value is SessionDurationMinutes {
  return (
    typeof value === "number" &&
    (SESSION_DURATION_MINUTES as readonly number[]).includes(value)
  );
}

/** Question count bounds for a session. Null/undefined duration = short pill. */
export function questionBudgetForDuration(durationMinutes?: number | null): {
  minQuestions: number;
  maxQuestions: number;
  mode: "pill" | "timed";
} {
  if (durationMinutes == null) {
    return { minQuestions: 3, maxQuestions: 6, mode: "pill" };
  }
  switch (durationMinutes) {
    case 15:
      return { minQuestions: 4, maxQuestions: 8, mode: "timed" };
    case 20:
      return { minQuestions: 5, maxQuestions: 10, mode: "timed" };
    case 30:
      return { minQuestions: 8, maxQuestions: 12, mode: "timed" };
    case 45:
      return { minQuestions: 10, maxQuestions: 16, mode: "timed" };
    case 60:
      return { minQuestions: 12, maxQuestions: 20, mode: "timed" };
    case 90:
      return { minQuestions: 15, maxQuestions: 25, mode: "timed" };
    default:
      return { minQuestions: 3, maxQuestions: 6, mode: "pill" };
  }
}

export interface InferredSyllabus {
  subjects: string[];
  styleNotes: string;
  difficultyNotes: string;
  seniority: string | null;
  materialRoles: string[];
}

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

export interface QuestionUpdateProposalDto {
  id: string;
  questionId: string;
  proposedPatch: QuestionUpdateInput;
  reason: string | null;
  status: ProposalStatus;
  createdAt: string;
  reviewedAt: string | null;
  questionPrompt: string;
  questionType: QuestionType;
  levelSlug: LevelSlug | "topic";
}

export interface PromptProposalDto {
  key: PromptKey;
  body: string;
  note?: string;
  proposedAt: string;
  currentVersion: number;
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
  /** Optional session length; omit for default short pill. */
  durationMinutes?: SessionDurationMinutes | null;
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
  durationMinutes: number | null;
  inferredSyllabus: InferredSyllabus | null;
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
  constraints: {
    minQuestions: number;
    maxQuestions: number;
    mode: "pill" | "timed";
  };
}

export interface TopicPresetDefinition {
  slug: TopicPresetSlug;
  label: Record<LocaleCode, string>;
  guidelinesTemplate: Record<LocaleCode, string>;
  focusExamples: Record<LocaleCode, string[]>;
}

/** Catalog row for open exams tracked by crawler / bank (product home). */
export interface ExamCatalogItemDto {
  id: string;
  examSlug: string;
  title: string;
  org: string | null;
  banca: string | null;
  emphasis: string[];
  editalUrl: string | null;
  listingUrl: string | null;
  status: "open" | "unknown";
  bankQuestionCount: number;
  bankReady: boolean;
  sourceDomain: string | null;
  placeholder?: boolean;
}

export interface ExamPrepareResponse {
  topicId: string;
  exam: ExamCatalogItemDto;
  created: boolean;
}
