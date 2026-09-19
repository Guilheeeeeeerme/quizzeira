// Concept: Triage — recurring maintenance over the document pile.
//
// Runs far less often than the process pass (hours, not seconds) and owns
// three chores none of the content stages do:
//   1. re-try the LLM classifier on documents still `unknown` / low-confidence
//      (bounded; what stays unknown is the admin's to label);
//   2. prune clearly useless documents (bytes + sections/chunks, stub row stays);
//   3. retention — delete raw bytes of terminal documents after a grace period.
// Every purge is reported to Discovery so Artifact rows know the object is gone.
import { hasLlmProvider, isDeferrableLlmError, logInfo, logWarn } from "@quizzeira/worker-kit";
import type { NormalizedDocument } from "@quizzeira/shared";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";
import { classifyDocument } from "./classify.js";
import { classifyRoleLlmResidue } from "./classify-llm.js";

const NAME = "content-worker";
/** After this many LLM re-tries an uncertain file waits for a human. */
const MAX_RECLASSIFY_ATTEMPTS = 3;
const RECLASSIFY_BACKOFF_MS = 24 * 60 * 60 * 1000;
/** Roles worth reprocessing under: the stages that produce something. */
const ACTIONABLE_ROLES = new Set(["specification", "evidence", "knowledge", "mixed"]);

interface UncertainDocument {
  id: string;
  examSlug: string;
  examTitle: string | null;
  kind: string;
  role: string;
  roleConfidence: number | null;
  outcome: Record<string, unknown> | null;
}

interface TriageBookkeeping {
  attempts: number;
  lastAt: string;
  lastResult: string;
}

export interface TriagePassResult {
  reclassified: number;
  stillUncertain: number;
  pruned: number;
  purged: number;
  deferred: boolean;
}

let lastRunAt = 0;

/** Interval gate: the loop ticks every few seconds; triage runs hourly-ish. */
export function triageDue(now = Date.now()): boolean {
  return now - lastRunAt >= contentEnv.triageIntervalMs;
}

export async function runTriagePass(): Promise<TriagePassResult> {
  lastRunAt = Date.now();
  const result: TriagePassResult = {
    reclassified: 0,
    stillUncertain: 0,
    pruned: 0,
    purged: 0,
    deferred: false,
  };

  // 1. Uncertain documents → one more LLM opinion, bounded and backed off.
  if (contentEnv.triageReclassifyEnabled && hasLlmProvider()) {
    const { items } = await content.get<{ items: UncertainDocument[] }>(
      `/internal/triage/uncertain?limit=${contentEnv.triageDocsPerPass}`,
    );
    for (const document of items) {
      const book = (document.outcome?.triage as TriageBookkeeping | undefined) ?? null;
      if (book && book.attempts >= MAX_RECLASSIFY_ATTEMPTS) continue;
      if (book && Date.now() - Date.parse(book.lastAt) < RECLASSIFY_BACKOFF_MS) continue;
      try {
        const { document: normalized } = await content.get<{ document: NormalizedDocument }>(
          `/internal/documents/${document.id}/normalized`,
        );
        const lexical = classifyDocument(normalized, { roleHint: null, kindHint: null });
        const current = {
          ...lexical,
          role: document.role as typeof lexical.role,
          roleConfidence: document.roleConfidence ?? 0,
        };
        const verdict = await classifyRoleLlmResidue(normalized, current);
        const attempts = (book?.attempts ?? 0) + 1;
        const decided = Boolean(verdict && verdict.role !== "unknown");
        const triage: TriageBookkeeping = {
          attempts,
          lastAt: new Date().toISOString(),
          lastResult: decided ? `llm:${verdict!.role}` : "llm:undecided",
        };
        if (decided) {
          // New actionable role → full reprocess so syllabus/evidence/knowledge
          // run under it; otherwise just record the verdict.
          await content.patch(`/internal/documents/${document.id}`, {
            role: verdict!.role,
            roleConfidence: verdict!.roleConfidence,
            roleMethod: "llm_triage",
            subtype: verdict!.subtype,
            ...(ACTIONABLE_ROLES.has(verdict!.role)
              ? { status: "pending", failReason: null }
              : {}),
            outcome: { ...(document.outcome ?? {}), triage },
          });
          result.reclassified += 1;
        } else {
          await content.patch(`/internal/documents/${document.id}`, {
            outcome: { ...(document.outcome ?? {}), triage },
          });
          result.stillUncertain += 1;
        }
      } catch (err) {
        if (isDeferrableLlmError(err)) {
          result.deferred = true;
          logWarn("triage reclassify deferred: LLM budget or provider unavailable", {
            worker: NAME,
            error: String(err).slice(0, 200),
          });
          break;
        }
        logWarn("triage reclassify failed", {
          worker: NAME,
          documentId: document.id,
          error: String(err).slice(0, 200),
        });
      }
    }
  }

  // 2. Prune clearly useless documents.
  const purgedArtifactIds: string[] = [];
  if (contentEnv.triagePruneEnabled) {
    const { pruned } = await content.post<{
      pruned: Array<{ id: string; reason: string; artifactId: string | null; bytesDeleted: boolean }>;
    }>("/internal/triage/prune", { limit: contentEnv.triagePrunePerPass });
    result.pruned = pruned.length;
    for (const p of pruned) if (p.bytesDeleted && p.artifactId) purgedArtifactIds.push(p.artifactId);
  }

  // 3. Retention: raw bytes of terminal documents past the grace period.
  if (contentEnv.retentionEnabled) {
    const { purged } = await content.post<{
      purged: Array<{ storageKey: string; artifactIds: string[] }>;
    }>("/internal/retention/purge-artifacts", {
      olderThanDays: contentEnv.retentionGraceDays,
      limit: contentEnv.retentionPerPass,
    });
    result.purged = purged.length;
    for (const p of purged) purgedArtifactIds.push(...p.artifactIds);
  }

  if (purgedArtifactIds.length > 0) {
    await discovery
      .post("/internal/artifacts/mark-purged", { artifactIds: purgedArtifactIds })
      .catch((err) =>
        logWarn("mark-purged failed", { worker: NAME, error: String(err).slice(0, 200) }),
      );
  }

  if (result.reclassified || result.stillUncertain || result.pruned || result.purged) {
    logInfo("triage pass", { worker: NAME, ...result });
  }
  return result;
}
