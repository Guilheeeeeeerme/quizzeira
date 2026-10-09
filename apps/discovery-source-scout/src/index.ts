// Concept: Discovery source expansion (curated official portal scout → SourceCandidate)
import Fastify from "fastify";
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { sourceScoutEnv } from "./env.js";
import { runSourceScoutPass } from "./pass.js";

process.env.SERVICE_NAME ||= "quizzeira-discoverysourcescout";
const NAME = "discovery-source-scout";

let tickInFlight = false;

async function tick(): Promise<void> {
  if (!sourceScoutEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "DISCOVERY_SOURCE_SCOUT_ENABLED=false" });
    return;
  }
  if (tickInFlight) {
    logInfo("skip", { worker: NAME, reason: "previous pass still running" });
    return;
  }
  tickInFlight = true;
  try {
    await runSourceScoutPass();
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
  await app.listen({ port: sourceScoutEnv.port, host: "0.0.0.0" });

  logInfo("interval mode", {
    worker: NAME,
    intervalMs: workerEnv.intervalMs,
    port: sourceScoutEnv.port,
    enabled: sourceScoutEnv.enabled,
    maxPerPass: sourceScoutEnv.maxPerPass,
    priorityFilter: sourceScoutEnv.priorityFilter || "(all)",
    windows: workerEnv.windows || "(any)",
    timeZone: workerEnv.timeZone,
  });
  void runLoop(NAME, workerEnv.intervalMs, tick);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
