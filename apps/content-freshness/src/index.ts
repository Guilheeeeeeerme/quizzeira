// Concept: Content knowledge freshness (legislation amendment watcher → requeue)
import Fastify from "fastify";
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { freshnessEnv } from "./env.js";
import { runFreshnessPass } from "./pass.js";

process.env.SERVICE_NAME ||= "quizzeira-contentfreshness";
const NAME = "content-freshness";

let tickInFlight = false;

async function tick(): Promise<void> {
  if (!freshnessEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "CONTENT_FRESHNESS_ENABLED=false" });
    return;
  }
  if (tickInFlight) {
    logInfo("skip", { worker: NAME, reason: "previous pass still running" });
    return;
  }
  tickInFlight = true;
  try {
    await runFreshnessPass();
  } finally {
    tickInFlight = false;
  }
}

async function bootstrap(): Promise<void> {
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({
    ok: true,
    service: NAME,
    dryRun: freshnessEnv.dryRun,
  }));
  app.post("/internal/tick", async () => {
    await tick();
    return { ok: true };
  });
  await app.listen({ port: freshnessEnv.port, host: "0.0.0.0" });

  logInfo("interval mode", {
    worker: NAME,
    intervalMs: workerEnv.intervalMs,
    port: freshnessEnv.port,
    enabled: freshnessEnv.enabled,
    dryRun: freshnessEnv.dryRun,
    windows: workerEnv.windows || "(any)",
    timeZone: workerEnv.timeZone,
  });
  void runLoop(NAME, workerEnv.intervalMs, tick);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
