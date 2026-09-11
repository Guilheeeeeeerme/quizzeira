import { dmzPost, logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { runDiscoveryPipeline } from "./pipeline.js";

process.env.SERVICE_NAME ||= "quizzeira-examcrawler";
const NAME = "exam-crawler";

/**
 * Schedule: every EXAM_CRAWLER_INTERVAL_MS (default 30m) with empty windows.
 * Smart skip lives inside the pipeline (listing / open-exam fingerprints + bank).
 */
async function shouldRunDiscovery(): Promise<{ run: boolean; reason: string }> {
  if (!crawlerEnv.enabled) {
    return { run: false, reason: "EXAM_CRAWLER_ENABLED=false" };
  }

  const forced = await dmzPost<{ forced: boolean }>("/internal/crawler/force/consume");
  if (forced.forced) {
    return { run: true, reason: "admin force" };
  }

  return { run: true, reason: "scheduled interval" };
}

async function tick(): Promise<void> {
  const gate = await shouldRunDiscovery();
  if (!gate.run) {
    logInfo("skip", { worker: NAME, reason: gate.reason });
    return;
  }
  logInfo("discovery pass", { worker: NAME, reason: gate.reason });
  await runDiscoveryPipeline();
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  fixture: crawlerEnv.fixtureMode,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
