import { dmzPost, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { runDiscoveryPipeline } from "./pipeline.js";

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
    console.log(`[${NAME}] skip: ${gate.reason}`);
    return;
  }
  console.log(`[${NAME}] discovery pass: ${gate.reason}`);
  await runDiscoveryPipeline();
}

console.log(
  `[${NAME}] interval mode intervalMs=${workerEnv.intervalMs} fixture=${crawlerEnv.fixtureMode} windows=${workerEnv.windows || "(any)"} tz=${workerEnv.timeZone}`,
);
void runLoop(NAME, workerEnv.intervalMs, tick);
