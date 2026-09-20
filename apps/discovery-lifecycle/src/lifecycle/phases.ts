/**
 * Exam lifecycle phases for Discovery.
 *
 * Registration OPEN/CLOSED stay on ExamStatus (`open` | `closed` | `unknown`).
 * This enum is the concurso calendar machine owned by discovery-lifecycle.
 *
 * Domain mapping:
 * - OPEN  = registration_open (inscrições abertas)
 * - CLOSED = registration_closed and later phases (inscrições encerradas)
 */
export const EXAM_LIFECYCLE_PHASES = [
  "announced",
  "registration_open",
  "registration_closed",
  "exam_scheduled",
  "exam_done",
  "past_due",
  "cancelled",
  "archived",
] as const;

export type ExamLifecyclePhase = (typeof EXAM_LIFECYCLE_PHASES)[number];

/** Registration wire statuses already on Discovery ExamStatus. */
export type RegistrationStatus = "open" | "closed" | "unknown";

export type TransitionReason =
  | "registration_signal"
  | "registration_end_passed"
  | "exam_date_passed"
  | "archive_grace_elapsed"
  | "admin"
  | "checker"
  | "idempotent_noop";

export interface LifecycleTransition {
  from: ExamLifecyclePhase;
  to: ExamLifecyclePhase;
  reason: TransitionReason;
  /** Mirrored onto Exam.status when set. */
  registrationStatus?: RegistrationStatus;
}

/** Allowed edges. Self-edges are handled as idempotent no-ops elsewhere. */
export const ALLOWED_TRANSITIONS: Readonly<
  Record<ExamLifecyclePhase, readonly ExamLifecyclePhase[]>
> = {
  announced: ["registration_open", "cancelled"],
  registration_open: ["registration_closed", "cancelled"],
  registration_closed: ["exam_scheduled", "exam_done", "cancelled"],
  exam_scheduled: ["exam_done", "cancelled"],
  exam_done: ["past_due"],
  past_due: ["archived"],
  cancelled: ["archived"],
  archived: [],
};

export function isExamLifecyclePhase(value: string): value is ExamLifecyclePhase {
  return (EXAM_LIFECYCLE_PHASES as readonly string[]).includes(value);
}

export function registrationStatusForPhase(
  phase: ExamLifecyclePhase,
): RegistrationStatus {
  if (phase === "registration_open") return "open";
  if (phase === "announced") return "unknown";
  return "closed";
}

export function phaseFromRegistrationStatus(
  status: RegistrationStatus,
): ExamLifecyclePhase {
  if (status === "open") return "registration_open";
  if (status === "closed") return "registration_closed";
  return "announced";
}

export function canTransition(
  from: ExamLifecyclePhase,
  to: ExamLifecyclePhase,
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Idempotent apply: same phase → noop; illegal edge → null; else transition.
 */
export function applyTransition(
  from: ExamLifecyclePhase,
  to: ExamLifecyclePhase,
  reason: TransitionReason,
): LifecycleTransition | null {
  if (from === to) {
    return { from, to, reason: "idempotent_noop", registrationStatus: registrationStatusForPhase(to) };
  }
  if (!canTransition(from, to)) return null;
  return {
    from,
    to,
    reason,
    registrationStatus: registrationStatusForPhase(to),
  };
}

export interface ExamLifecycleSnapshot {
  phase: ExamLifecyclePhase;
  registrationStatus: RegistrationStatus;
  registrationStart?: Date | null;
  registrationEnd?: Date | null;
  examDate?: Date | null;
  archivedAt?: Date | null;
  purgeEligibleAt?: Date | null;
}

/**
 * Derive the next phase from dates + registration signals without IO.
 * Checkers / crawler outputs feed `registrationStatus` and dates.
 */
export function deriveNextPhase(
  snap: ExamLifecycleSnapshot,
  now: Date = new Date(),
): LifecycleTransition | null {
  const { phase } = snap;

  if (phase === "archived" || phase === "cancelled") {
    return applyTransition(phase, phase, "idempotent_noop");
  }

  // Explicit registration open signal (crawler OPEN / date window).
  // Never reopen after registration_closed or later.
  if (snap.registrationStatus === "open" && phase === "announced") {
    return applyTransition(phase, "registration_open", "registration_signal");
  }

  // Registration end passed → CLOSED.
  if (
    snap.registrationEnd &&
    snap.registrationEnd.getTime() < now.getTime() &&
    (phase === "registration_open" || phase === "announced")
  ) {
    return applyTransition(phase, "registration_closed", "registration_end_passed");
  }

  // Explicit closed signal while still in registration_open.
  if (snap.registrationStatus === "closed" && phase === "registration_open") {
    return applyTransition(phase, "registration_closed", "registration_signal");
  }

  // Exam date passed: schedule → done → past_due in one derived step to past_due
  // when already exam_done, else exam_done first.
  if (snap.examDate && snap.examDate.getTime() < now.getTime()) {
    if (phase === "exam_scheduled" || phase === "registration_closed") {
      return applyTransition(phase, "exam_done", "exam_date_passed");
    }
    if (phase === "exam_done") {
      return applyTransition(phase, "past_due", "exam_date_passed");
    }
  }

  // Soft-archive after purgeEligibleAt (set when entering past_due).
  if (
    phase === "past_due" &&
    snap.purgeEligibleAt &&
    snap.purgeEligibleAt.getTime() <= now.getTime()
  ) {
    return applyTransition(phase, "archived", "archive_grace_elapsed");
  }

  return applyTransition(phase, phase, "idempotent_noop");
}
