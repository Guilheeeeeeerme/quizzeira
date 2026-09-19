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

logInfo("interval mode", {
  worker: NAME,
  intervalMs: workerEnv.intervalMs,
  enabled: socialEnv.enabled,
  fixture: socialEnv.fixtureMode,
  adapters: socialEnv.adapters,
  windows: workerEnv.windows || "(any)",
  timeZone: workerEnv.timeZone,
});
void runLoop(NAME, workerEnv.intervalMs, tick);
