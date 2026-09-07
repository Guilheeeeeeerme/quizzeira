import { workerEnv } from "./env";

const MINUTES_PER_DAY = 1440;
const WINDOW_TOLERANCE_MINUTES = 30;

export function parseWindows(spec: string): number[] {
  const trimmed = spec.trim();
  if (!trimmed) return [];
  const windows: number[] = [];
  for (const part of trimmed.split(",")) {
    const label = part.trim();
    const match = /^(\d{1,2}):(\d{2})$/.exec(label);
    if (!match) {
      throw new Error(`Invalid WORKER_WINDOWS entry: ${label}`);
    }
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) {
      throw new Error(`Invalid WORKER_WINDOWS entry: ${label}`);
    }
    const value = hour * 60 + minute;
    if (!windows.includes(value)) windows.push(value);
  }
  return windows.sort((a, b) => a - b);
}

export function minutesOfDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error(`Failed to read time for timezone: ${timeZone}`);
  }
  return hour * 60 + minute;
}

export function isWithinWindows(
  date: Date,
  windows: number[],
  timeZone: string,
): boolean {
  if (windows.length === 0) return true;
  const now = minutesOfDay(date, timeZone);
  return windows.some((window) => {
    const diff = Math.abs(now - window);
    return Math.min(diff, MINUTES_PER_DAY - diff) <= WINDOW_TOLERANCE_MINUTES;
  });
}

export interface RunLoopOptions {
  now?: () => Date;
  windows?: string;
  timeZone?: string;
}

export async function runLoop(
  name: string,
  intervalMs: number,
  tick: () => Promise<void>,
  opts: RunLoopOptions = {},
): Promise<() => void> {
  const now = opts.now ?? (() => new Date());
  const windows = parseWindows(opts.windows ?? workerEnv.windows);
  const timeZone = opts.timeZone ?? workerEnv.timeZone;
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
  } catch {
    throw new Error(`Invalid WORKER_TZ: ${timeZone}`);
  }
  if (windows.length > 0) {
    console.log(`[${name}] schedule windows=${(opts.windows ?? workerEnv.windows).trim()} tz=${timeZone}`);
  }

  let firstRun = true;
  const run = async () => {
    const gated =
      windows.length > 0 &&
      !firstRun &&
      !isWithinWindows(now(), windows, timeZone);
    if (gated) return;
    firstRun = false;
    try {
      await tick();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${name}] tick failed: ${message}`);
    }
  };

  await run();
  const timer = setInterval(() => {
    void run();
  }, intervalMs);
  timer.unref?.();
  return () => clearInterval(timer);
}
