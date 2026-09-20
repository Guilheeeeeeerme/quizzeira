import Fastify from "fastify";
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { socialEnv } from "./env.js";
import { runSocialScoutPass } from "./pipeline.js";

process.env.SERVICE_NAME ||= "quizzeira-discoverysocialscout";
const NAME = "discovery-social-scout";

let tickInFlight = false;

async function tick(): Promise<void> {
  if (!socialEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "DISCOVERY_SOCIAL_ENABLED=false" });
    return;
  }
  if (tickInFlight) {
    logInfo("skip", { worker: NAME, reason: "previous pass still running" });
    return;
  }
  tickInFlight = true;
  try {
    await runSocialScoutPass();
  } finally {
    tickInFlight = false;
  }
}

async function bootstrap(): Promise<void> {
  // Same shape as discovery-lifecycle: the deploy's `compose up --wait`
  // health-checks every service, and an operator can force one pass.
  const app = Fastify({ logger: false });
  app.get("/health", async () => ({ ok: true, service: NAME }));
  app.post("/internal/tick", async () => {
    await tick();
    return { ok: true };
  });
  await app.listen({ port: socialEnv.port, host: "0.0.0.0" });

  logInfo("interval mode", {
    worker: NAME,
    intervalMs: workerEnv.intervalMs,
    port: socialEnv.port,
    enabled: socialEnv.enabled,
    fixture: socialEnv.fixtureMode,
    adapters: socialEnv.adapters,
    windows: workerEnv.windows || "(any)",
    timeZone: workerEnv.timeZone,
  });
  void runLoop(NAME, workerEnv.intervalMs, tick);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
