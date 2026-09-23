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
  allowExamDateHardDelete,
  decideCalendarGc,
  type CalendarGcDecision,
} from "./lifecycle/gc.js";
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

function yearSignals(exam: LifecycleExamDto) {
  return {
    examDate: parseDate(exam.examDate),
    registrationEnd: parseDate(exam.registrationEnd),
    editionKey: exam.editionKey,
    examSlug: exam.examSlug,
    title: exam.title,
    listingUrl: exam.listingUrl,
  };
}

async function runHardDelete(
  exam: LifecycleExamDto,
  decision: {
    deleteArtifacts: boolean;
    deleteTopicQueries: boolean;
    deleteMinioObjects: boolean;
    deleteExamTombstone: boolean;
    reason: string;
  },
  meta: Record<string, unknown>,
): Promise<void> {
  const dryRun = lifecycleEnv.dryRun;
  const result = await applyLifecyclePurge({
    examId: exam.id,
    deleteArtifacts: decision.deleteArtifacts,
    deleteTopicQueries: decision.deleteTopicQueries,
    deleteMinioObjects: decision.deleteMinioObjects,
    deleteExamTombstone: decision.deleteExamTombstone,
    dryRun,
  });
  logInfo(dryRun ? "lifecycle hard_delete dry_run" : "lifecycle hard_delete", {
    examId: exam.id,
    reason: decision.reason,
    dryRun,
    deletedArtifacts: result.deletedArtifacts ?? 0,
    deletedObjects: result.deletedObjects ?? 0,
    wouldDeleteArtifacts: result.wouldDeleteArtifacts ?? 0,
    wouldDeleteObjects: result.wouldDeleteObjects ?? 0,
    ...meta,
  });
}

async function applyCalendarGc(
  exam: LifecycleExamDto,
  now: Date,
  signals: ReturnType<typeof yearSignals>,
): Promise<"done" | "continue"> {
  if (!lifecycleEnv.calendarGcEnabled) return "continue";

  let gc: CalendarGcDecision = decideCalendarGc({
    phase: exam.lifecyclePhase,
    signals,
    artifacts: exam.artifacts ?? [],
    now,
    dryRun: lifecycleEnv.dryRun,
    dropTombstone: lifecycleEnv.dropTombstone,
  });

  if (gc.reason === "gc_year_missing" || gc.reason === "gc_year_conflict") {
    logWarn("lifecycle gc fail-closed", {
      examId: exam.id,
      reason: gc.reason,
      yearSources: gc.yearSources,
    });
    return "continue";
  }

  if (gc.reason === "gc_hold_pending_knowledge") {
    logInfo("lifecycle gc hold", {
      examId: exam.id,
      year: gc.year,
      pendingKnowledge: gc.pendingKnowledge,
    });
    // Do not fall through to examDate hard-delete while knowledge awaits import.
    return "done";
  }

  if (gc.action === "soft_archive") {
    if (!lifecycleEnv.dryRun) {
      await applyLifecycleTransition({
        examId: exam.id,
        to: "archived",
        reason: "archive_grace_elapsed",
        registrationStatus: "closed",
        archivedAt: now.toISOString(),
      });
    }
    logInfo(
      lifecycleEnv.dryRun ? "lifecycle gc soft_archive dry_run" : "lifecycle gc soft_archive",
      {
        examId: exam.id,
        year: gc.year,
        reason: gc.reason,
        dryRun: lifecycleEnv.dryRun,
      },
    );
    exam.lifecyclePhase = "archived";
    exam.archivedAt = now.toISOString();
    // Same pass: re-evaluate for hard delete once soft-archived.
    gc = decideCalendarGc({
      phase: exam.lifecyclePhase,
      signals,
      artifacts: exam.artifacts ?? [],
      now,
      dryRun: lifecycleEnv.dryRun,
      dropTombstone: lifecycleEnv.dropTombstone,
    });
  }

  if (gc.action === "hard_delete_discovery") {
    await runHardDelete(exam, gc, {
      year: gc.year,
      pendingKnowledge: gc.pendingKnowledge,
      path: "calendar_gc",
    });
    return "done";
  }

  return "continue";
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
  const signals = yearSignals(exam);

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

  const calendarResult = await applyCalendarGc(exam, now, signals);
  if (calendarResult === "done") return;

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
    // When calendar GC is on, hard deletes belong to that path only (knowledge
    // gate + product-year retain). ExamDate path may still hard-delete if
    // calendar GC is disabled, but always behind the year fail-closed gate.
    if (lifecycleEnv.calendarGcEnabled) {
      logInfo("lifecycle examDate hard_delete deferred to calendar_gc", {
        examId: exam.id,
      });
      return;
    }
    const gate = allowExamDateHardDelete(signals, now);
    if (!gate.allowed) {
      logWarn("lifecycle hard_delete blocked by calendar gate", {
        examId: exam.id,
        reason: gate.reason,
        year: gate.year,
      });
      return;
    }
    await runHardDelete(exam, decision, {
      year: gate.year,
      path: "exam_date_purge",
    });
  }
}

/** One lifecycle pass over a Discovery exam batch. */
export async function runLifecyclePass(now = new Date()): Promise<{ scanned: number }> {
  const items = await listLifecycleExams(
    lifecycleEnv.batchSize,
    lifecycleEnv.hardDeleteGraceDays,
    lifecycleEnv.calendarGcEnabled,
  );
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
