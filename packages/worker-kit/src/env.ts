import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../../.env") });

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite";

export const workerEnv = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  intervalMs: num("WORKER_INTERVAL_MS", 60_000),
  internalApiUrl: (process.env.INTERNAL_API_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  internalApiKey: process.env.INTERNAL_API_KEY ?? "dev-internal-key",
};
