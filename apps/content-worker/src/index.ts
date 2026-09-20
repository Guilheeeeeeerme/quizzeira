// Concept: Extraction + Embeddings + Generation (continuous content loop)
//
// Pipeline v2 only: import → process → planner → eligible embeddings → leaf generation.
// Legacy exam-level generation and hand-rolled PDF extraction are removed (§48.8).
import {
  checkProviderReadiness,
  logInfo,
  logWarn,
  newRunId,
  runLoop,
  withRunIdAsync,
  workerEnv,
} from "@quizzeira/worker-kit";
import { contentEnv } from "./env.js";
import { runEmbeddingPass } from "./embeddings/index.js";
import { runGenerationPass } from "./generation/index.js";
import { runImportPass } from "./stages/import.js";
import { runPlannerPass } from "./stages/planner.js";
import { runProcessPass } from "./stages/process.js";
import { runTriagePass, triageDue } from "./stages/triage.js";

process.env.SERVICE_NAME ||= "quizzeira-contentworker";
const NAME = "content-worker";

/**
 * Failure-domain profiles (§4 / §12 worker extraction). One image, multiple
 * entrypoints: the monolith stays the default (`all`) until shadow metrics
 * prove the split profiles are stable. A profile picks the passes it owns;
 * per-pass stage flags still gate everything.
 *   all        — current monolithic behavior (default)
 *   documents  — import + process + planner (memory-heavy, browser/LLM-free)
 *   embeddings — eligible chunk embeddings (provider-light)
 *   generation — canonical/stage generation (LLM provider only)
 *   maintenance — triage: reclassify uncertain docs, prune useless, retention
 */
type WorkerProfile = "all" | "documents" | "embeddings" | "generation" | "maintenance";
const PROFILE = (
  (process.env.CONTENT_WORKER_PROFILE ?? "all").trim().toLowerCase() || "all"
) as WorkerProfile;
const VALID: readonly WorkerProfile[] = [
  "all",
  "documents",
  "embeddings",
  "generation",
  "maintenance",
];
const profile: WorkerProfile = VALID.includes(PROFILE) ? PROFILE : "all";
if (profile !== PROFILE) {
  logWarn("unknown CONTENT_WORKER_PROFILE, falling back to all", {
    worker: NAME,
    requested: PROFILE,
  });
}

const runsDocumentPasses = profile === "all" || profile === "documents";
const runsEmbeddingPass = profile === "all" || profile === "embeddings";
const runsGenerationPass = profile === "all" || profile === "generation";
const runsMaintenancePass = profile === "all" || profile === "maintenance";

async function tick(): Promise<void> {
  await withRunIdAsync(newRunId(), async () => {
  if (runsDocumentPasses && contentEnv.stageImportEnabled) {
    await runImportPass().catch((err) =>
      logWarn("import pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (runsDocumentPasses && contentEnv.extractionEnabled) {
    await runProcessPass().catch((err) =>
      logWarn("process pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (runsDocumentPasses && contentEnv.stagePlannerEnabled) {
    await runPlannerPass().catch((err) =>
      logWarn("planner pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (runsEmbeddingPass && contentEnv.embeddingsEnabled) {
    await runEmbeddingPass().catch((err) =>
      logWarn("embedding pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (runsGenerationPass && contentEnv.generationEnabled) {
    await runGenerationPass().catch((err) =>
      logWarn("generation pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (runsMaintenancePass && contentEnv.triageEnabled && triageDue()) {
    await runTriagePass().catch((err) =>
      logWarn("triage pass errored", { worker: NAME, error: String(err) }),
    );
  }
  });
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  profile,
  extraction: contentEnv.extractionEnabled,
  embeddings: contentEnv.embeddingsEnabled,
  generation: contentEnv.generationEnabled,
  triage: contentEnv.triageEnabled,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});

/**
 * Startup readiness (§9): the generation pass is provider-dependent, so a
 * missing/exhausted provider is loud in logs even though the pass itself
 * already no-ops via `hasLlmProvider()` — this doesn't gate the loop, the
 * per-call circuit breaker already does that.
 */
if (runsGenerationPass && contentEnv.generationEnabled) {
  checkProviderReadiness().then((readiness) => {
    if (!readiness.ready) {
      logWarn("provider readiness check failed at startup", {
        worker: NAME,
        event: "readiness_unhealthy",
        reason: readiness.reason,
        providers: readiness.providers,
      });
    } else {
      logInfo("provider readiness ok", { worker: NAME, providers: readiness.providers });
    }
  });
}

void runLoop(NAME, workerEnv.intervalMs, tick);
