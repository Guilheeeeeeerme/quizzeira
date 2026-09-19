/**
 * Quizzeira edge watchdog (§9.1): Cloudflare Worker (Free plan), Cron every
 * five minutes. Checks bounded public health endpoints from outside the VPS
 * and notifies the operator webhook only on state changes (or when a target
 * remains unhealthy past the reminder threshold). Persists a tiny state
 * record in Workers KV. No internal data, no payloads, no provider traffic.
 */
interface WatchTarget {
  name: string;
  url: string;
}

interface TargetState {
  healthy: boolean;
  consecutiveFailures: number;
}

interface Env {
  WATCH_TARGETS: string;
  ALERT_WEBHOOK?: string;
  WATCH_SECRET?: string;
  WATCH_UNHEALTHY_THRESHOLD?: string;
  WATCH_STATE: KVNamespace;
}

const STATE_SLOT = "targets-v1";
const MAX_TARGETS = 10;
const FETCH_TIMEOUT_MS = 10_000;

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const targets = parseTargets(env.WATCH_TARGETS);
    if (targets.length === 0) {
      console.log("edge-watchdog: no WATCH_TARGETS configured");
      return;
    }
    const threshold = Math.max(1, Number(env.WATCH_UNHEALTHY_THRESHOLD ?? "3"));
    const previous =
      (await readState(env.WATCH_STATE)) ?? ({} as Record<string, TargetState>);

    const results: Record<string, TargetState> = {};
    const alerts: string[] = [];

    for (const target of targets) {
      const prevState =
        previous[target.name] ?? ({ healthy: true, consecutiveFailures: 0 } as TargetState);
      const healthy = await checkTarget(env, target.url);
      const state: TargetState = {
        healthy,
        consecutiveFailures: healthy ? 0 : prevState.consecutiveFailures + 1,
      };
      results[target.name] = state;
      // Exactly one alert on a state change; a healthy recovery also alerts.
      if (healthy !== prevState.healthy) {
        alerts.push(
          healthy
            ? `recovered: ${target.name}`
            : `failing: ${target.name} (${state.consecutiveFailures} consecutive failed checks)`,
        );
      } else if (
        // Reminder while persistently unhealthy, one per full threshold window.
        !healthy &&
        state.consecutiveFailures > threshold &&
        state.consecutiveFailures % threshold === 0
      ) {
        alerts.push(
          `still unhealthy: ${target.name} (${state.consecutiveFailures} consecutive failed checks)`,
        );
      }
    }

    await env.WATCH_STATE.put(STATE_SLOT, JSON.stringify(results));
    if (alerts.length > 0 && env.ALERT_WEBHOOK) {
      const text = `quizzeira edge-watchdog: ${alerts.join("; ")}`;
      await sendAlert(env.ALERT_WEBHOOK, text);
    }
    console.log(
      `edge-watchdog: checked ${targets.length} target(s), ${alerts.length} alert(s)`,
      { outcomes: Object.keys(results).length },
    );
  },
};

function parseTargets(raw: string | undefined): WatchTarget[] {
  if (!raw || !raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.log("edge-watchdog: WATCH_TARGETS is not valid JSON");
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const targets = parsed.filter((entry) => {
    return (
      entry !== null &&
      typeof entry === "object" &&
      "name" in entry &&
      "url" in entry &&
      typeof entry.name === "string" &&
      typeof entry.url === "string" &&
      /^https?:\/\//.test(entry.url) &&
      !entry.url.includes("/internal/")
    );
  }) as WatchTarget[];
  return targets.slice(0, MAX_TARGETS);
}

/** Bounded public health probe: GET, 10 s cap, no body inspection. */
async function checkTarget(env: Env, url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: env.WATCH_SECRET ? { "x-watch-secret": env.WATCH_SECRET } : {},
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function readState(state: KVNamespace): Promise<Record<string, TargetState> | null> {
  try {
    const raw = await state.get(STATE_SLOT);
    if (!raw) return null;
    JSON.parse(raw) as Record<string, TargetState>;
    return JSON.parse(raw) as Record<string, TargetState>;
  } catch {
    return null;
  }
}

async function sendAlert(webhook: string, text: string): Promise<void> {
  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch {
    // The watchdog must never throw on notification failure.
  }
}
