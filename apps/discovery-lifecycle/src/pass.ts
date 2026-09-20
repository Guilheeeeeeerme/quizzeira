import { logInfo, logWarn } from "@quizzeira/worker-kit";
import {
  applyLifecyclePurge,
  applyLifecycleTransition,
  listLifecycleExams,
  type LifecycleExamDto,
} from "./discovery-client.js";
import { lifecycleEnv } from "./env.js";
import { DEFAULT_CHECKERS, runCheckers } from "./lifecycle/checkers.js";
import {
  deriveNextPhase,
  isExamLifecyclePhase,
  type ExamLifecyclePhase,
  type RegistrationStatus,
} from "./lifecycle/phases.js";
import { phaseLabel, reasonLabel } from "./lifecycle/labels.js";
import {
  computePurgeEligibleAt,
  decidePurge,
  type PurgePolicyConfig,
} from "./lifecycle/purge.js";

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function asRegistrationStatus(value: string): RegistrationStatus {
  if (value === "open" || value === "closed") return value;
  return "unknown";
}

function purgeConfig(): PurgePolicyConfig {
  return {
    softArchiveGraceDays: lifecycleEnv.softArchiveGraceDays,
    hardDeleteGraceDays: lifecycleEnv.hardDeleteGraceDays,
    dropTombstone: lifecycleEnv.dropTombstone,
  };
}

async function processExam(exam: LifecycleExamDto, now: Date): Promise<void> {
  if (!isExamLifecyclePhase(exam.lifecyclePhase)) {
    logWarn("unknown lifecycle phase", { examId: exam.id, phase: exam.lifecyclePhase });
    return;
  }

  const registrationEnd = parseDate(exam.registrationEnd);
  const registrationStart = parseDate(exam.registrationStart);
  const examDate = parseDate(exam.examDate);
  const archivedAt = parseDate(exam.archivedAt);
  const purgeEligibleAt = parseDate(exam.purgeEligibleAt);

  const signal = runCheckers(DEFAULT_CHECKERS, {
    now,
    registrationStart,
    registrationEnd,
    crawlerStatus: asRegistrationStatus(exam.status),
    statusSource: exam.statusSource,
  });

  const derived = deriveNextPhase(
    {
      phase: exam.lifecyclePhase,
      registrationStatus: signal.status,
      registrationStart,
      registrationEnd,
      examDate,
      archivedAt,
      purgeEligibleAt,
    },
    now,
  );

  if (derived && derived.reason !== "idempotent_noop" && derived.from !== derived.to) {
    let nextPurgeEligibleAt: string | null | undefined;
    if (derived.to === "past_due" && examDate) {
      nextPurgeEligibleAt = computePurgeEligibleAt(examDate, purgeConfig()).toISOString();
    }
    let nextArchivedAt: string | null | undefined;
    if (derived.to === "archived") {
      nextArchivedAt = now.toISOString();
    }

    await applyLifecycleTransition({
      examId: exam.id,
      to: derived.to,
      reason: derived.reason,
      registrationStatus: derived.registrationStatus,
      purgeEligibleAt: nextPurgeEligibleAt,
      archivedAt: nextArchivedAt,
    });
    logInfo("lifecycle transition", {
      examId: exam.id,
      from: derived.from,
      to: derived.to,
      reason: derived.reason,
      fromLabel: phaseLabel(derived.from, "pt"),
      toLabel: phaseLabel(derived.to, "pt"),
      reasonLabel: reasonLabel(derived.reason, "pt"),
    });
    exam.lifecyclePhase = derived.to;
    if (nextPurgeEligibleAt) exam.purgeEligibleAt = nextPurgeEligibleAt;
    if (nextArchivedAt) exam.archivedAt = nextArchivedAt;
  }

  const decision = decidePurge({
    phase: exam.lifecyclePhase as ExamLifecyclePhase,
    examDate,
    archivedAt: parseDate(exam.archivedAt),
    purgeEligibleAt: parseDate(exam.purgeEligibleAt),
    now,
    config: purgeConfig(),
  });

  if (decision.action === "mark_past_due") {
    const eligible = examDate
      ? computePurgeEligibleAt(examDate, purgeConfig()).toISOString()
      : null;
    await applyLifecycleTransition({
      examId: exam.id,
      to: "past_due",
      reason: decision.reason,
      registrationStatus: "closed",
      purgeEligibleAt: eligible,
    });
    logInfo("lifecycle past_due", { examId: exam.id });
    return;
  }

  if (decision.action === "soft_archive") {
    await applyLifecycleTransition({
      examId: exam.id,
      to: "archived",
      reason: decision.reason,
      registrationStatus: "closed",
      archivedAt: now.toISOString(),
    });
    logInfo("lifecycle soft_archive", { examId: exam.id });
    return;
  }

  if (decision.action === "hard_delete_discovery") {
    const result = await applyLifecyclePurge({
      examId: exam.id,
      deleteArtifacts: decision.deleteArtifacts,
      deleteTopicQueries: decision.deleteTopicQueries,
      deleteMinioObjects: decision.deleteMinioObjects,
      deleteExamTombstone: decision.deleteExamTombstone,
    });
    logInfo("lifecycle hard_delete", {
      examId: exam.id,
      deletedArtifacts: result.deletedArtifacts ?? 0,
    });
  }
}

/** One lifecycle pass over a Discovery exam batch. */
export async function runLifecyclePass(now = new Date()): Promise<{ scanned: number }> {
  const items = await listLifecycleExams(lifecycleEnv.batchSize, lifecycleEnv.hardDeleteGraceDays);
  for (const exam of items) {
    try {
      await processExam(exam, now);
    } catch (err) {
      logWarn("lifecycle exam failed", {
        examId: exam.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { scanned: items.length };
}
