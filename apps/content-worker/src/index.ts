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

async function tick(): Promise<void> {
  await withRunIdAsync(newRunId(), async () => {
  if (contentEnv.stageImportEnabled) {
    await runImportPass().catch((err) =>
      logWarn("import pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (contentEnv.extractionEnabled) {
    await runProcessPass().catch((err) =>
      logWarn("process pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (contentEnv.stagePlannerEnabled) {
    await runPlannerPass().catch((err) =>
      logWarn("planner pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (contentEnv.embeddingsEnabled) {
    await runEmbeddingPass().catch((err) =>
      logWarn("embedding pass errored", { worker: NAME, error: String(err) }),
    );
  }
  if (contentEnv.generationEnabled) {
    await runGenerationPass().catch((err) =>
      logWarn("generation pass errored", { worker: NAME, error: String(err) }),
    );
  }
  });
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  extraction: contentEnv.extractionEnabled,
  embeddings: contentEnv.embeddingsEnabled,
  generation: contentEnv.generationEnabled,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
