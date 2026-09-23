import { dmzGet, dmzPost } from "@quizzeira/worker-kit";
import type { ExamLifecyclePhase, RegistrationStatus } from "./lifecycle/phases.js";
import type { GcArtifactSignal } from "./lifecycle/gc.js";

/** Wire DTO from discovery-api /internal/lifecycle/exams */
export interface LifecycleExamDto {
  id: string;
  examSlug: string;
  title: string;
  editionKey: string | null;
  listingUrl: string;
  status: RegistrationStatus;
  lifecyclePhase: ExamLifecyclePhase;
  registrationStart: string | null;
  registrationEnd: string | null;
  examDate: string | null;
  archivedAt: string | null;
  purgeEligibleAt: string | null;
  statusSource: string | null;
  artifacts: GcArtifactSignal[];
}

export interface TransitionRequest {
  examId: string;
  to: ExamLifecyclePhase;
  reason: string;
  registrationStatus?: RegistrationStatus;
  purgeEligibleAt?: string | null;
  archivedAt?: string | null;
}

export interface PurgeRequest {
  examId: string;
  deleteArtifacts: boolean;
  deleteTopicQueries: boolean;
  deleteMinioObjects: boolean;
  deleteExamTombstone: boolean;
  dryRun?: boolean;
}

export async function listLifecycleExams(
  limit: number,
  hardDeleteGraceDays: number,
  includeCalendarGc = true,
): Promise<LifecycleExamDto[]> {
  const qs = new URLSearchParams({
    limit: String(limit),
    hardDeleteGraceDays: String(hardDeleteGraceDays),
  });
  if (includeCalendarGc) qs.set("includeCalendarGc", "1");
  const res = await dmzGet<{ items: LifecycleExamDto[] }>(
    `/internal/lifecycle/exams?${qs.toString()}`,
  );
  return res.items ?? [];
}

export async function applyLifecycleTransition(
  body: TransitionRequest,
): Promise<{ ok: boolean; noop?: boolean }> {
  return dmzPost("/internal/lifecycle/transition", body);
}

export async function applyLifecyclePurge(
  body: PurgeRequest,
): Promise<{
  ok: boolean;
  dryRun?: boolean;
  deletedArtifacts?: number;
  deletedObjects?: number;
  wouldDeleteArtifacts?: number;
  wouldDeleteObjects?: number;
}> {
  return dmzPost("/internal/lifecycle/purge", body);
}
