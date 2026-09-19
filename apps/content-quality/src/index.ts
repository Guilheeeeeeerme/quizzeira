// Concept: Eval (continuous publish-gate loop)
//
// This worker owns the only draft → published transition in the platform.
// If it stops, nothing new reaches learners — which is the intended failure mode.
import {
  checkProviderReadiness,
  logInfo,
  logWarn,
  newRunId,
  runLoop,
  withRunIdAsync,
  workerEnv,
} from "@quizzeira/worker-kit";
import { qualityEnv } from "./env.js";
import { runEvalPass } from "./pipeline.js";

process.env.SERVICE_NAME ||= "quizzeira-contentquality";
const NAME = "content-quality";

async function tick(): Promise<void> {
  if (!qualityEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "CONTENT_QUALITY_ENABLED=false" });
    return;
  }
  await withRunIdAsync(newRunId(), () => runEvalPass());
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  publishThreshold: qualityEnv.publishThreshold,
  failThreshold: qualityEnv.failThreshold,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});

/** Startup readiness (§9): Eval is the only draft→published gate — a missing/exhausted provider must be loud. */
if (qualityEnv.enabled) {
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
