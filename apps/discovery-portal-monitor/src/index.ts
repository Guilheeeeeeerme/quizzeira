// Concept: Discovery portal health (probe Sources → health + force-crawl recovery)
import Fastify from "fastify";
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { portalMonitorEnv } from "./env.js";
import { runPortalMonitorPass } from "./pass.js";

process.env.SERVICE_NAME ||= "quizzeira-discoveryportalmonitor";
const NAME = "discovery-portal-monitor";

let tickInFlight = false;

async function tick(): Promise<void> {
  if (!portalMonitorEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "DISCOVERY_PORTAL_MONITOR_ENABLED=false" });
    return;
  }
  if (tickInFlight) {
    logInfo("skip", { worker: NAME, reason: "previous pass still running" });
    return;
  }
  tickInFlight = true;
  try {
    await runPortalMonitorPass();
  } finally {
    tickInFlight = false;
  }
}

async function bootstrap(): Promise<void> {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, service: NAME }));
  app.post("/internal/tick", async () => {
    await tick();
    return { ok: true };
  });
  await app.listen({ port: portalMonitorEnv.port, host: "0.0.0.0" });

  logInfo("interval mode", {
    worker: NAME,
    intervalMs: workerEnv.intervalMs,
    port: portalMonitorEnv.port,
    enabled: portalMonitorEnv.enabled,
    forceCrawlOnRecover: portalMonitorEnv.forceCrawlOnRecover,
    staleHours: portalMonitorEnv.staleHours,
    windows: workerEnv.windows || "(any)",
    timeZone: workerEnv.timeZone,
  });
  void runLoop(NAME, workerEnv.intervalMs, tick);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
