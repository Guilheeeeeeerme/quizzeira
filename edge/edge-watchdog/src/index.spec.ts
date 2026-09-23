// Concept: edge-watchdog acceptance criterion (§14 / §12 Next item 8) —
// "one state-change alert", never duplicated, never missed, across a
// synthetic public-health failure/recovery sequence. No live Cloudflare
// account needed: KVNamespace and fetch are faked in-process.

import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import handler from "./index";

class FakeKV implements KVNamespace {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}

const ctx: ExecutionContext = { waitUntil: () => undefined };
const controller: ScheduledController = { scheduledTime: 0, cron: "*/5 * * * *" };

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

/** Scripted fetch: each health target's outcome is queued per tick; the
 * alert webhook always succeeds and its calls are captured. */
function stubFetch(
  healthByTargetUrl: Record<string, boolean[]>,
  alertCalls: Array<{ url: string; body: unknown }>,
) {
  const cursors: Record<string, number> = {};
  global.fetch = (async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    if (url in healthByTargetUrl) {
      const i = cursors[url] ?? 0;
      cursors[url] = i + 1;
      const ok = healthByTargetUrl[url][Math.min(i, healthByTargetUrl[url].length - 1)];
      return new Response(null, { status: ok ? 200 : 503 });
    }
    // Alert webhook.
    alertCalls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null });
    return new Response(null, { status: 200 });
  }) as typeof fetch;
}

describe("edge-watchdog: one state-change alert (§14 acceptance)", () => {
  it("alerts exactly once on failure, once more on recovery, never while stable", async () => {
    const target = "https://api.concurseria.ferredemo.dev/health";
    const webhook = "https://hooks.example/alert";
    const kv = new FakeKV();
    const alerts: Array<{ url: string; body: unknown }> = [];
    const env = {
      WATCH_TARGETS: JSON.stringify([{ name: "api", url: target }]),
      ALERT_WEBHOOK: webhook,
      WATCH_UNHEALTHY_THRESHOLD: "3",
      WATCH_STATE: kv,
    };

    // healthy, healthy, fail, fail, fail (still below/at first reminder?),
    // fail, healthy — six ticks.
    const sequence = [true, true, false, false, false, false, true];
    stubFetch({ [target]: sequence }, alerts);
    for (let i = 0; i < sequence.length; i += 1) {
      await handler.scheduled(controller, env, ctx);
    }

    // Transitions: tick3 healthy→unhealthy (alert), tick7 unhealthy→healthy
    // (alert). Ticks 4-6 stay unhealthy at consecutiveFailures 2,3,4 — a
    // reminder fires only when consecutiveFailures > threshold AND is a
    // multiple of it, so only consecutiveFailures=4 would (4>3, 4%3≠0 — no
    // reminder in this short a run). Exactly two alerts total.
    assert.equal(alerts.length, 2, `expected exactly 2 alerts, got ${alerts.length}: ${JSON.stringify(alerts)}`);
    assert.match(String((alerts[0].body as { text: string }).text), /failing: api/);
    assert.match(String((alerts[1].body as { text: string }).text), /recovered: api/);
  });

  it("never alerts twice for the same ongoing failure before the reminder threshold", async () => {
    const target = "https://api.concurseria.ferredemo.dev/health";
    const kv = new FakeKV();
    const alerts: Array<{ url: string; body: unknown }> = [];
    const env = {
      WATCH_TARGETS: JSON.stringify([{ name: "api", url: target }]),
      ALERT_WEBHOOK: "https://hooks.example/alert",
      WATCH_UNHEALTHY_THRESHOLD: "3",
      WATCH_STATE: kv,
    };

    // healthy, then unhealthy for 3 ticks straight (consecutiveFailures 1,2,3).
    const sequence = [true, false, false, false];
    stubFetch({ [target]: sequence }, alerts);
    for (let i = 0; i < sequence.length; i += 1) {
      await handler.scheduled(controller, env, ctx);
    }

    // Only the initial failure transition alerts; consecutiveFailures=3 is
    // not yet > threshold (3), so no reminder fires yet either.
    assert.equal(alerts.length, 1, `expected exactly 1 alert, got ${alerts.length}: ${JSON.stringify(alerts)}`);
    assert.match(String((alerts[0].body as { text: string }).text), /failing: api/);
  });

  it("fires exactly one reminder once consecutiveFailures passes a full threshold window", async () => {
    const target = "https://api.concurseria.ferredemo.dev/health";
    const kv = new FakeKV();
    const alerts: Array<{ url: string; body: unknown }> = [];
    const env = {
      WATCH_TARGETS: JSON.stringify([{ name: "api", url: target }]),
      ALERT_WEBHOOK: "https://hooks.example/alert",
      WATCH_UNHEALTHY_THRESHOLD: "3",
      WATCH_STATE: kv,
    };

    // healthy, then unhealthy for 6 ticks (consecutiveFailures 1..6).
    // consecutiveFailures=6 is the first value both >3 and a multiple of 3.
    const sequence = [true, false, false, false, false, false, false];
    stubFetch({ [target]: sequence }, alerts);
    for (let i = 0; i < sequence.length; i += 1) {
      await handler.scheduled(controller, env, ctx);
    }

    assert.equal(alerts.length, 2, `expected initial + one reminder, got ${alerts.length}: ${JSON.stringify(alerts)}`);
    assert.match(String((alerts[0].body as { text: string }).text), /failing: api \(1 consecutive/);
    assert.match(String((alerts[1].body as { text: string }).text), /still unhealthy: api \(6 consecutive/);
  });

  it("a stable healthy target across many ticks never alerts", async () => {
    const target = "https://api.concurseria.ferredemo.dev/health";
    const kv = new FakeKV();
    const alerts: Array<{ url: string; body: unknown }> = [];
    const env = {
      WATCH_TARGETS: JSON.stringify([{ name: "api", url: target }]),
      ALERT_WEBHOOK: "https://hooks.example/alert",
      WATCH_UNHEALTHY_THRESHOLD: "3",
      WATCH_STATE: kv,
    };
    const sequence = [true, true, true, true, true];
    stubFetch({ [target]: sequence }, alerts);
    for (let i = 0; i < sequence.length; i += 1) {
      await handler.scheduled(controller, env, ctx);
    }
    assert.equal(alerts.length, 0);
  });

  it("independent targets: one failing never suppresses or duplicates the other's alert", async () => {
    const targetA = "https://a.example/health";
    const targetB = "https://b.example/health";
    const kv = new FakeKV();
    const alerts: Array<{ url: string; body: unknown }> = [];
    const env = {
      WATCH_TARGETS: JSON.stringify([
        { name: "a", url: targetA },
        { name: "b", url: targetB },
      ]),
      ALERT_WEBHOOK: "https://hooks.example/alert",
      WATCH_UNHEALTHY_THRESHOLD: "3",
      WATCH_STATE: kv,
    };
    stubFetch(
      { [targetA]: [true, false, false], [targetB]: [true, true, true] },
      alerts,
    );
    for (let i = 0; i < 3; i += 1) {
      await handler.scheduled(controller, env, ctx);
    }
    assert.equal(alerts.length, 1);
    assert.match(String((alerts[0].body as { text: string }).text), /failing: a/);
    assert.doesNotMatch(String((alerts[0].body as { text: string }).text), /: b/);
  });
});
