// Concept: Extraction + Embeddings + Generation (continuous content loop)
//
// Order matters: extraction produces chunks, embeddings make them retrievable,
// generation consumes the retrievable ones. Running them in sequence in one
// tick means new material becomes draft questions within a few passes.
import { logInfo, logWarn, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { contentEnv } from "./env.js";
import { runEmbeddingPass } from "./embeddings/index.js";
import { runExtractionPass } from "./extraction/index.js";
import { runGenerationPass } from "./generation/index.js";

process.env.SERVICE_NAME ||= "quizzeira-contentworker";
const NAME = "content-worker";

async function tick(): Promise<void> {
  if (contentEnv.extractionEnabled) {
    await runExtractionPass().catch((err) =>
      logWarn("extraction pass errored", { worker: NAME, error: String(err) }),
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
