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

export const lifecycleEnv = {
  port: num("PORT", 3012),
  enabled: flag("DISCOVERY_LIFECYCLE_ENABLED", true),
  softArchiveGraceDays: num("DISCOVERY_LIFECYCLE_SOFT_ARCHIVE_DAYS", 30),
  hardDeleteGraceDays: num("DISCOVERY_LIFECYCLE_HARD_DELETE_DAYS", 90),
  dropTombstone: flag("DISCOVERY_LIFECYCLE_DROP_TOMBSTONE", false),
  batchSize: num("DISCOVERY_LIFECYCLE_BATCH_SIZE", 50),
  /**
   * Safety default ON: calendar-year and examDate hard deletes only log what
   * they would remove. Set DISCOVERY_LIFECYCLE_DRY_RUN=false to mutate.
   */
  dryRun: flag("DISCOVERY_LIFECYCLE_DRY_RUN", true),
  /** Calendar-year product-inventory GC (past year → purge when safe). */
  calendarGcEnabled: flag("DISCOVERY_LIFECYCLE_CALENDAR_GC", true),
};
