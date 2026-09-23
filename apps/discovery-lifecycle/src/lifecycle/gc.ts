/**
 * Calendar-year garbage collector for Discovery exam storage.
 *
 * Scope: Discovery Artifact rows + MinIO objects + TopicQuery. Never Study or
 * Content banks. Knowledge extracted into Content stays there; Discovery only
 * drops raw inventory once safe (or when past-year and worthless).
 *
 * Safety:
 * - Fail-closed on ambiguous/missing year
 * - Hold when knowledge-useful bytes still await Content import
 * - Idempotent decisions for the same input state
 */

import {
  isPastCalendarYear,
  isProductInventoryYear,
  resolveExamYear,
  type ExamYearSignals,
} from "./calendar-year.js";

/** Roles that feed syllabus / evidence / KU pipelines. */
export const KNOWLEDGE_USEFUL_ROLES = new Set([
  "specification",
  "evidence",
  "knowledge",
]);

/** Artifact kinds that typically carry exam/knowledge payload. */
export const KNOWLEDGE_USEFUL_KINDS = new Set([
  "edital",
  "prova",
  "gabarito",
  "programa",
]);

export const KNOWLEDGE_USEFUL_KIND_HINTS = new Set([
  "edital",
  "retificacao",
  "programa",
  "prova",
  "gabarito",
  "padrao_resposta",
  "apostila",
  "lei",
  "artigo",
  "manual",
]);

export interface GcArtifactSignal {
  roleHint?: string | null;
  kind?: string | null;
  kindHint?: string | null;
  published?: boolean | null;
  bytesPurgedAt?: string | Date | null;
  storageKey?: string | null;
  byteSize?: number | null;
}

export type CalendarGcAction =
  | "none"
  | "soft_archive"
  | "hard_delete_discovery";

export interface CalendarGcDecision {
  action: CalendarGcAction;
  deleteArtifacts: boolean;
  deleteTopicQueries: boolean;
  deleteMinioObjects: boolean;
  deleteExamTombstone: boolean;
  reason: string;
  year: number | null;
  yearSources: string[];
  pendingKnowledge: number;
  worthlessOrExtracted: number;
}

export interface CalendarGcInput {
  phase: string;
  signals: ExamYearSignals;
  artifacts: GcArtifactSignal[];
  now?: Date;
  /** When true, decision still reports hard_delete but caller must not mutate. */
  dryRun?: boolean;
  dropTombstone?: boolean;
}

export function isKnowledgeUseful(a: GcArtifactSignal): boolean {
  if (a.roleHint && KNOWLEDGE_USEFUL_ROLES.has(a.roleHint)) return true;
  if (a.kind && KNOWLEDGE_USEFUL_KINDS.has(a.kind)) return true;
  if (a.kindHint && KNOWLEDGE_USEFUL_KIND_HINTS.has(a.kindHint)) return true;
  return false;
}

/** Bytes still needed by Content import / extraction. */
export function awaitsKnowledgeExtraction(a: GcArtifactSignal): boolean {
  if (!isKnowledgeUseful(a)) return false;
  if (a.published) return false;
  if (a.bytesPurgedAt) return false;
  if (!a.storageKey) return false;
  return true;
}

function idle(
  reason: string,
  year: number | null,
  yearSources: string[],
  pendingKnowledge: number,
  worthlessOrExtracted: number,
): CalendarGcDecision {
  return {
    action: "none",
    deleteArtifacts: false,
    deleteTopicQueries: false,
    deleteMinioObjects: false,
    deleteExamTombstone: false,
    reason,
    year,
    yearSources,
    pendingKnowledge,
    worthlessOrExtracted,
  };
}

/**
 * Decide calendar-year GC action. Does not itself mutate storage.
 */
export function decideCalendarGc(input: CalendarGcInput): CalendarGcDecision {
  const now = input.now ?? new Date();
  const resolved = resolveExamYear(input.signals);
  const artifacts = input.artifacts ?? [];
  const pending = artifacts.filter(awaitsKnowledgeExtraction).length;
  const settled = artifacts.length - pending;

  if (!resolved.ok) {
    return idle(
      resolved.reason === "conflicting_years"
        ? "gc_year_conflict"
        : "gc_year_missing",
      null,
      resolved.sources,
      pending,
      settled,
    );
  }

  const { year, sources } = resolved;

  if (isProductInventoryYear(year, now)) {
    return idle("gc_retain_product_year", year, sources, pending, settled);
  }

  if (!isPastCalendarYear(year, now)) {
    return idle("gc_retain_product_year", year, sources, pending, settled);
  }

  // Past calendar year.
  if (pending > 0) {
    return idle("gc_hold_pending_knowledge", year, sources, pending, settled);
  }

  if (input.phase !== "archived") {
    return {
      action: "soft_archive",
      deleteArtifacts: false,
      deleteTopicQueries: false,
      deleteMinioObjects: false,
      deleteExamTombstone: false,
      reason: "gc_past_year_soft_archive",
      year,
      yearSources: sources,
      pendingKnowledge: pending,
      worthlessOrExtracted: settled,
    };
  }

  return {
    action: "hard_delete_discovery",
    deleteArtifacts: true,
    deleteTopicQueries: true,
    deleteMinioObjects: true,
    deleteExamTombstone: Boolean(input.dropTombstone),
    reason: input.dryRun
      ? "gc_past_year_hard_delete_dry_run"
      : "gc_past_year_hard_delete",
    year,
    yearSources: sources,
    pendingKnowledge: pending,
    worthlessOrExtracted: settled,
  };
}

/**
 * Gate on the older examDate-driven hard delete: never hard-delete current/
 * future-year inventory, and never when year is ambiguous.
 */
export function allowExamDateHardDelete(
  signals: ExamYearSignals,
  now: Date = new Date(),
): { allowed: boolean; reason: string; year: number | null } {
  const resolved = resolveExamYear(signals);
  if (!resolved.ok) {
    return {
      allowed: false,
      reason:
        resolved.reason === "conflicting_years"
          ? "gc_year_conflict"
          : "gc_year_missing",
      year: null,
    };
  }
  if (isProductInventoryYear(resolved.year, now)) {
    return {
      allowed: false,
      reason: "gc_retain_product_year",
      year: resolved.year,
    };
  }
  return { allowed: true, reason: "gc_past_year_ok", year: resolved.year };
}
