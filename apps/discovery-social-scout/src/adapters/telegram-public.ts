import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import {
  disabledResult,
  errorResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * Telegram Bot API — messages the operator-owned bot can already see
 * (channels/groups the bot was added to). Official Bot API only.
 * Docs: https://core.telegram.org/bots/api#getupdates
 */
export function createTelegramPublicAdapter(opts?: {
  botTokenEnv?: string;
  fetchFn?: FetchLike;
  limit?: number;
}): SocialSourceAdapter {
  const tokenKey = opts?.botTokenEnv ?? "TELEGRAM_BOT_TOKEN";
  return {
    id: "telegram-public",
    platform: "telegram",
    async fetchRecent() {
      const token = process.env[tokenKey] ?? "";
      if (!token.trim()) {
        logWarn("telegram adapter idle", {
          worker: "discovery-social-scout",
          reason: `${tokenKey} unset — disabled`,
        });
        return disabledResult(`missing credentials: ${tokenKey}`);
      }

      const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 100);
      const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("allowed_updates", JSON.stringify(["channel_post", "message"]));

      const res = await fetchJson<TgUpdatesResponse>(url.toString(), {
        fetchFn: opts?.fetchFn,
      });
      if (!res.ok) {
        logWarn("telegram adapter error", {
          worker: "discovery-social-scout",
          status: res.status,
        });
        return errorResult(`Telegram Bot API HTTP ${res.status}`);
      }
      if (!res.data.ok) {
        return errorResult("Telegram Bot API returned ok=false");
      }

      const posts: SocialPost[] = [];
      for (const update of res.data.result ?? []) {
        const msg = update.channel_post ?? update.message;
        if (!msg) continue;
        const chat = msg.chat;
        const text = [msg.text, msg.caption].filter(Boolean).join("\n");
        const attachments: string[] = [];
        for (const ent of [...(msg.entities ?? []), ...(msg.caption_entities ?? [])]) {
          if (ent.type === "url" && typeof ent.offset === "number" && typeof ent.length === "number") {
            attachments.push(text.slice(ent.offset, ent.offset + ent.length));
          }
          if (ent.type === "text_link" && ent.url) attachments.push(ent.url);
        }
        const username = chat.username ? `@${chat.username}` : String(chat.id);
        posts.push({
          platform: "telegram",
          externalId: `${chat.id}:${msg.message_id}`,
          permalink: chat.username
            ? `https://t.me/${chat.username}/${msg.message_id}`
            : undefined,
          feedLabel: username,
          text,
          attachmentUrls: attachments,
          observedAt: msg.date
            ? new Date(msg.date * 1000).toISOString()
            : new Date().toISOString(),
        });
      }

      return okResult(posts);
    },
  };
}

interface TgUpdatesResponse {
  ok: boolean;
  result?: Array<{
    message?: TgMessage;
    channel_post?: TgMessage;
  }>;
}

interface TgMessage {
  message_id: number;
  date?: number;
  text?: string;
  caption?: string;
  chat: { id: number; username?: string; title?: string };
  entities?: TgEntity[];
  caption_entities?: TgEntity[];
}

interface TgEntity {
  type: string;
  offset?: number;
  length?: number;
  url?: string;
}
