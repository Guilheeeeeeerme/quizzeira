// Concept: Ingestion (continuous crawl loop)
import { dmzPost, logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { crawlerEnv } from "./env.js";
import { runDiscoveryPipeline } from "./pipeline.js";

process.env.SERVICE_NAME ||= "quizzeira-discoverycrawler";
const NAME = "discovery-crawler";

async function tick(): Promise<void> {
  if (!crawlerEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "DISCOVERY_CRAWLER_ENABLED=false" });
    return;
  }
  // An admin "crawl now" can target a single Source; otherwise the pass covers
  // the next slice of the enabled registry.
  const forced = await dmzPost<{ forced: boolean; sourceId: string | null }>(
    "/internal/crawl/force/consume",
  ).catch(() => ({ forced: false, sourceId: null }));

  logInfo("ingestion pass", {
    worker: NAME,
    reason: forced.forced ? "admin force" : "scheduled interval",
    sourceId: forced.sourceId,
  });
  await runDiscoveryPipeline(forced.sourceId);
}

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  fixture: crawlerEnv.fixtureMode,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
