import { dmzGet, dmzPost } from "@quizzeira/worker-kit";
import type { ExamLifecyclePhase, RegistrationStatus } from "./lifecycle/phases.js";

/** Wire DTO from discovery-api /internal/lifecycle/exams */
export interface LifecycleExamDto {
  id: string;
  examSlug: string;
  status: RegistrationStatus;
  lifecyclePhase: ExamLifecyclePhase;
  registrationStart: string | null;
  registrationEnd: string | null;
  examDate: string | null;
  archivedAt: string | null;
  purgeEligibleAt: string | null;
  statusSource: string | null;
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
}

export async function listLifecycleExams(
  limit: number,
  hardDeleteGraceDays: number,
): Promise<LifecycleExamDto[]> {
  const res = await dmzGet<{ items: LifecycleExamDto[] }>(
    `/internal/lifecycle/exams?limit=${limit}&hardDeleteGraceDays=${hardDeleteGraceDays}`,
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
): Promise<{ ok: boolean; deletedArtifacts?: number }> {
  return dmzPost("/internal/lifecycle/purge", body);
}
