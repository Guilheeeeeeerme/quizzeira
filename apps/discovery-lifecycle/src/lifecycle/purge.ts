/**
 * Discovery-side stale exam purge policy.
 *
 * Scope: Discovery Exam metadata + Artifacts (+ MinIO objects) + TopicQuery rows.
 * NEVER deletes Study (`quizzeira_study`) or Content (`quizzeira_content`) banks.
 *
 * Flow:
 * 1. examDate passed → phase exam_done → past_due; set purgeEligibleAt = now + softArchiveGraceDays
 * 2. purgeEligibleAt reached → soft-archive (phase=archived, archivedAt=now)
 * 3. archivedAt + hardDeleteGraceDays → hard-delete Discovery artifacts/objects/topic queries
 *    Exam row retained as tombstone (lifecyclePhase=archived) unless operator sets dropTombstone.
 */

export interface PurgePolicyConfig {
  /** Days after examDate before soft-archive is allowed. Default 30. */
  softArchiveGraceDays: number;
  /** Days after archivedAt before hard-delete of Discovery artifacts. Default 90. */
  hardDeleteGraceDays: number;
  /** If true, delete the Exam tombstone after hard purge. Default false. */
  dropTombstone: boolean;
}

export const DEFAULT_PURGE_POLICY: PurgePolicyConfig = {
  softArchiveGraceDays: 30,
  hardDeleteGraceDays: 90,
  dropTombstone: false,
};

export type PurgeAction =
  | "none"
  | "mark_past_due"
  | "soft_archive"
  | "hard_delete_discovery";

export interface PurgeDecision {
  action: PurgeAction;
  /** Targets for hard delete (Discovery plane only). */
  deleteArtifacts: boolean;
  deleteTopicQueries: boolean;
  deleteMinioObjects: boolean;
  deleteExamTombstone: boolean;
  reason: string;
}

export interface PurgeInput {
  phase: string;
  examDate: Date | null;
  archivedAt: Date | null;
  purgeEligibleAt: Date | null;
  now?: Date;
  config?: Partial<PurgePolicyConfig>;
}

function daysFrom(base: Date, days: number): Date {
  return new Date(base.getTime() + days * 86_400_000);
}

export function computePurgeEligibleAt(
  examDate: Date,
  config: PurgePolicyConfig = DEFAULT_PURGE_POLICY,
): Date {
  return daysFrom(examDate, config.softArchiveGraceDays);
}

/**
 * Decide the next purge action. Idempotent: repeated calls with same state
 * yield the same action until state advances.
 */
export function decidePurge(input: PurgeInput): PurgeDecision {
  const cfg = { ...DEFAULT_PURGE_POLICY, ...input.config };
  const now = input.now ?? new Date();
  const idle: PurgeDecision = {
    action: "none",
    deleteArtifacts: false,
    deleteTopicQueries: false,
    deleteMinioObjects: false,
    deleteExamTombstone: false,
    reason: "no_action",
  };

  if (input.phase === "archived") {
    if (!input.archivedAt) {
      return { ...idle, reason: "archived_missing_archivedAt" };
    }
    const hardAt = daysFrom(input.archivedAt, cfg.hardDeleteGraceDays);
    if (now.getTime() < hardAt.getTime()) {
      return { ...idle, reason: "hard_delete_grace_pending" };
    }
    return {
      action: "hard_delete_discovery",
      deleteArtifacts: true,
      deleteTopicQueries: true,
      deleteMinioObjects: true,
      deleteExamTombstone: cfg.dropTombstone,
      reason: "hard_delete_grace_elapsed",
    };
  }

  if (input.phase === "past_due") {
    const eligible =
      input.purgeEligibleAt ??
      (input.examDate ? computePurgeEligibleAt(input.examDate, cfg) : null);
    if (!eligible || now.getTime() < eligible.getTime()) {
      return { ...idle, reason: "soft_archive_grace_pending" };
    }
    return {
      action: "soft_archive",
      deleteArtifacts: false,
      deleteTopicQueries: false,
      deleteMinioObjects: false,
      deleteExamTombstone: false,
      reason: "soft_archive_grace_elapsed",
    };
  }

  if (
    input.examDate &&
    input.examDate.getTime() < now.getTime() &&
    (input.phase === "exam_done" ||
      input.phase === "exam_scheduled" ||
      input.phase === "registration_closed")
  ) {
    return {
      action: "mark_past_due",
      deleteArtifacts: false,
      deleteTopicQueries: false,
      deleteMinioObjects: false,
      deleteExamTombstone: false,
      reason: "exam_date_passed",
    };
  }

  return idle;
}
