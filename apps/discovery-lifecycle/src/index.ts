// Concept: Discovery exam lifecycle (OPEN/CLOSED + past-due purge)
import Fastify from "fastify";
import { logInfo, runLoop, workerEnv } from "@quizzeira/worker-kit";
import { lifecycleEnv } from "./env.js";
import { runLifecyclePass } from "./pass.js";

process.env.SERVICE_NAME ||= "quizzeira-discoverylifecycle";
const NAME = "discovery-lifecycle";

let tickInFlight = false;

async function tick(): Promise<void> {
  if (!lifecycleEnv.enabled) {
    logInfo("skip", { worker: NAME, reason: "DISCOVERY_LIFECYCLE_ENABLED=false" });
    return;
  }
  if (tickInFlight) {
    logInfo("skip", { worker: NAME, reason: "previous pass still running" });
    return;
  }
  tickInFlight = true;
  try {
    const result = await runLifecyclePass();
    logInfo("lifecycle pass", { worker: NAME, scanned: result.scanned });
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
  await app.listen({ port: lifecycleEnv.port, host: "0.0.0.0" });

  logInfo("interval mode", {
    worker: NAME,
    intervalMs: workerEnv.intervalMs,
    port: lifecycleEnv.port,
    windows: workerEnv.windows || "(any)",
    timeZone: workerEnv.timeZone,
  });
  void runLoop(NAME, workerEnv.intervalMs, tick);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
