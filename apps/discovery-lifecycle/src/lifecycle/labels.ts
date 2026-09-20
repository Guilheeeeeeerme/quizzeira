import type { ExamLifecyclePhase, RegistrationStatus, TransitionReason } from "./phases.js";

/**
 * Operator-facing labels. Machine enum values stay English; display/docs default
 * to Brazilian Portuguese (concurso calendar language).
 */
export const PHASE_LABEL_PT: Record<ExamLifecyclePhase, string> = {
  announced: "Anunciado",
  registration_open: "Inscrições abertas",
  registration_closed: "Inscrições encerradas",
  exam_scheduled: "Prova agendada",
  exam_done: "Prova realizada",
  past_due: "Prazo encerrado (pós-prova)",
  cancelled: "Cancelado",
  archived: "Arquivado",
};

export const PHASE_LABEL_EN: Record<ExamLifecyclePhase, string> = {
  announced: "Announced",
  registration_open: "Registration open",
  registration_closed: "Registration closed",
  exam_scheduled: "Exam scheduled",
  exam_done: "Exam done",
  past_due: "Past due",
  cancelled: "Cancelled",
  archived: "Archived",
};

export const REGISTRATION_LABEL_PT: Record<RegistrationStatus, string> = {
  open: "Inscrições abertas",
  closed: "Inscrições encerradas",
  unknown: "Situação desconhecida",
};

export const REASON_LABEL_PT: Record<TransitionReason, string> = {
  registration_signal: "Sinal de inscrição (checker/crawler)",
  registration_end_passed: "Fim das inscrições (data)",
  exam_date_passed: "Data da prova ultrapassada",
  archive_grace_elapsed: "Período de graça para arquivo",
  admin: "Ação administrativa",
  checker: "Checker",
  idempotent_noop: "Sem mudança (idempotente)",
};

export function phaseLabel(
  phase: ExamLifecyclePhase,
  locale: "pt" | "en" = "pt",
): string {
  return locale === "en" ? PHASE_LABEL_EN[phase] : PHASE_LABEL_PT[phase];
}

export function registrationLabel(
  status: RegistrationStatus,
  locale: "pt" | "en" = "pt",
): string {
  if (locale === "en") {
    if (status === "open") return "Open";
    if (status === "closed") return "Closed";
    return "Unknown";
  }
  return REGISTRATION_LABEL_PT[status];
}

export function reasonLabel(
  reason: TransitionReason,
  locale: "pt" | "en" = "pt",
): string {
  if (locale === "en") return reason;
  return REASON_LABEL_PT[reason];
}
