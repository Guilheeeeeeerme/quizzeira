import { logWarn } from "@quizzeira/worker-kit";
import type { SocialPost, SocialSourceAdapter } from "../types.js";

/**
 * Skeleton for Telegram Bot API / public channel exports.
 * Live calls require an operator-owned bot token and channels that allow it.
 * Does not scrape private groups or bypass Telegram ToS.
 */
export function createTelegramPublicAdapter(opts?: {
  /** When set, a future implementation may call Bot API getUpdates / channel history. */
  botTokenEnv?: string;
}): SocialSourceAdapter {
  const tokenKey = opts?.botTokenEnv ?? "TELEGRAM_BOT_TOKEN";
  return {
    id: "telegram-public",
    platform: "telegram",
    async fetchRecent(): Promise<SocialPost[]> {
      const token = process.env[tokenKey];
      if (!token) {
        logWarn("telegram adapter idle", {
          worker: "discovery-social-scout",
          reason: `${tokenKey} unset — stub returns []`,
        });
        return [];
      }
      // Intentional stub: wire official Bot API here; never scrape t.me HTML.
      logWarn("telegram adapter stub", {
        worker: "discovery-social-scout",
        reason: "live Bot API client not implemented; returning []",
      });
      return [];
    },
  };
}
