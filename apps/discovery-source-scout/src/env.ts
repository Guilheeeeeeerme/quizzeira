import "dotenv/config";

function num(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function flag(key: string, fallback: boolean): boolean {
  const raw = process.env[key];
  if (raw == null || raw === "") return fallback;
  return raw !== "false" && raw !== "0";
}

export const sourceScoutEnv = {
  port: num("PORT", 3014),
  enabled: flag("DISCOVERY_SOURCE_SCOUT_ENABLED", false),
  /** Max catalog entries proposed per tick. */
  maxPerPass: num("DISCOVERY_SOURCE_SCOUT_MAX_PER_PASS", 6),
  /** When set, only this priority band is proposed (P0|P1|P2). Empty = all. */
  priorityFilter: (process.env.DISCOVERY_SOURCE_SCOUT_PRIORITY || "").trim().toUpperCase(),
};
