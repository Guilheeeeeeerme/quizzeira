// Concept: Eval (continuous publish-gate loop)
//
// This worker owns the only draft → published transition in the platform.
// If it stops, nothing new reaches learners — which is the intended failure mode.
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { qualityEnv } from "./env.js";
import { runEvalPass } from "./pipeline.js";

process.env.SERVICE_NAME ||= "quizzeira-contentquality";
const NAME = "content-quality";

async function tick(): Promise<void> {
  if (!qualityEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "CONTENT_QUALITY_ENABLED=false" });
    return;
  }
  await runEvalPass();
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  publishThreshold: qualityEnv.publishThreshold,
  failThreshold: qualityEnv.failThreshold,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
