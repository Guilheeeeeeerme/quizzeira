// Concept: Extraction + Embeddings + Generation (continuous content loop)
//
// Pipeline v2 only: import → process → planner → eligible embeddings → leaf generation.
// Legacy exam-level generation and hand-rolled PDF extraction are removed (§48.8).
import { logInfo, logWarn, newRunId, runLoop, withRunIdAsync, workerEnv } from "@quizzeira/worker-kit";
import { contentEnv } from "./env.js";
import { runEmbeddingPass } from "./embeddings/index.js";
import { runGenerationPass } from "./generation/index.js";
import { runImportPass } from "./stages/import.js";
import { runPlannerPass } from "./stages/planner.js";
import { runProcessPass } from "./stages/process.js";

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
 */
type WorkerProfile = "all" | "documents" | "embeddings" | "generation";
const PROFILE = (
  (process.env.CONTENT_WORKER_PROFILE ?? "all").trim().toLowerCase() || "all"
) as WorkerProfile;
const VALID: readonly WorkerProfile[] = ["all", "documents", "embeddings", "generation"];
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
  });
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  profile,
  extraction: contentEnv.extractionEnabled,
  embeddings: contentEnv.embeddingsEnabled,
  generation: contentEnv.generationEnabled,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
