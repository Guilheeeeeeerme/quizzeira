import { describe, expect, it, vi } from "vitest";
import { isWithinWindows, minutesOfDay, parseWindows, runLoop } from "./loop";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("parseWindows", () => {
  it("returns empty list for empty specs", () => {
    expect(parseWindows("")).toEqual([]);
    expect(parseWindows("   ")).toEqual([]);
  });

  it("parses HH:MM lists into minutes and dedupes", () => {
    expect(parseWindows("07:00,19:00")).toEqual([420, 1140]);
    expect(parseWindows("07:00, 07:00")).toEqual([420]);
  });

  it("rejects malformed entries", () => {
    expect(() => parseWindows("07:00,bad")).toThrow(/Invalid WORKER_WINDOWS entry: bad/);
    expect(() => parseWindows("25:00")).toThrow();
    expect(() => parseWindows("07:60")).toThrow();
  });
});

describe("minutesOfDay", () => {
  it("reads wall-clock time in the requested timezone", () => {
    const utcNoon = new Date(Date.UTC(2026, 0, 1, 12, 0));
    expect(minutesOfDay(utcNoon, "UTC")).toBe(720);
    expect(minutesOfDay(utcNoon, "America/Sao_Paulo")).toBe(540);
  });
});

describe("isWithinWindows (fixed clock)", () => {
  const windows = [420]; // 07:00

  it("accepts times inside the ±30min window", () => {
    const at = (h: number, m: number) => new Date(Date.UTC(2026, 0, 1, h, m));
    expect(isWithinWindows(at(7, 0), windows, "UTC")).toBe(true);
    expect(isWithinWindows(at(6, 30), windows, "UTC")).toBe(true);
    expect(isWithinWindows(at(7, 29), windows, "UTC")).toBe(true);
  });

  it("rejects times outside the window", () => {
    const at = (h: number, m: number) => new Date(Date.UTC(2026, 0, 1, h, m));
    expect(isWithinWindows(at(6, 29), windows, "UTC")).toBe(false);
    expect(isWithinWindows(at(7, 31), windows, "UTC")).toBe(false);
    expect(isWithinWindows(at(12, 0), windows, "UTC")).toBe(false);
  });

  it("wraps around midnight", () => {
    const at = (h: number, m: number) => new Date(Date.UTC(2026, 0, 1, h, m));
    expect(isWithinWindows(at(23, 50), [1430], "UTC")).toBe(true);
    expect(isWithinWindows(at(0, 10), [1430], "UTC")).toBe(true);
    expect(isWithinWindows(at(0, 40), [1430], "UTC")).toBe(false);
  });

  it("runs everything when no windows are configured", () => {
    expect(isWithinWindows(new Date(), [], "UTC")).toBe(true);
  });
});

describe("runLoop window gating", () => {
  it("runs first run immediately, skips outside the window, resumes inside", async () => {
    let current = new Date(Date.UTC(2026, 0, 1, 7, 0));
    const ticks: number[] = [];
    const stop = await runLoop(
      "test-loop",
      10,
      async () => {
        ticks.push(ticks.length);
      },
      {
        now: () => current,
        windows: "07:00,19:00",
        timeZone: "UTC",
      },
    );
    expect(ticks).toHaveLength(1);

    current = new Date(Date.UTC(2026, 0, 1, 10, 0));
    await sleep(60);
    expect(ticks).toHaveLength(1);

    current = new Date(Date.UTC(2026, 0, 1, 19, 0));
    await sleep(60);
    expect(ticks.length).toBeGreaterThan(1);

    stop();
  });

  it("runs continuously when no windows are configured", async () => {
    let current = new Date(Date.UTC(2026, 0, 1, 3, 0));
    const ticks: number[] = [];
    const stop = await runLoop(
      "test-continuous",
      10,
      async () => {
        ticks.push(ticks.length);
      },
      { now: () => current, timeZone: "UTC" },
    );
    await sleep(60);
    expect(ticks.length).toBeGreaterThan(1);
    stop();
  });

  it("keeps ticking when the tick throws", async () => {
    const stop = await runLoop(
      "test-error",
      10,
      async () => {
        throw new Error("boom");
      },
      { now: () => new Date(), timeZone: "UTC" },
    );
    await sleep(60);
    stop();
  });
});
