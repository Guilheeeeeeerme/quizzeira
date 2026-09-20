import { logWarn } from "@quizzeira/worker-kit";
import { fetchJson } from "../http.js";
import { resolveKeywords } from "../keywords.js";
import {
  googleQuerySuffix,
  providerLocaleParams,
  resolveSocialLocale,
} from "../locale.js";
import {
  disabledResult,
  errorResult,
  okResult,
  type FetchLike,
  type SocialPost,
  type SocialSourceAdapter,
} from "../types.js";

/**
 * Google Custom Search JSON API — documented public search results.
 * Docs: https://developers.google.com/custom-search/v1/overview
 * Requires API key + Programmable Search Engine (cx).
 *
 * pt-BR shaping: `lr=lang_pt`, `gl=br`, `hl=pt-BR`, plus edital/gabarito/prova
 * query suffix.
 */
export function createGoogleCseAdapter(opts?: {
  apiKeyEnv?: string;
  cxEnv?: string;
  fetchFn?: FetchLike;
  keywords?: string[];
  resultsPerKeyword?: number;
}): SocialSourceAdapter {
  const keyEnv = opts?.apiKeyEnv ?? "GOOGLE_CSE_API_KEY";
  const cxEnv = opts?.cxEnv ?? "GOOGLE_CSE_CX";
  return {
    id: "google-cse",
    platform: "google",
    async fetchRecent() {
      const apiKey = process.env[keyEnv] ?? "";
      const cx = process.env[cxEnv] ?? "";
      if (!apiKey.trim() || !cx.trim()) {
        logWarn("google-cse adapter idle", {
          worker: "discovery-social-scout",
          reason: `${keyEnv}/${cxEnv} unset — disabled`,
        });
        return disabledResult(`missing credentials: ${keyEnv} and/or ${cxEnv}`);
      }

      const locale = resolveSocialLocale();
      const loc = providerLocaleParams(locale);
      const keywords = opts?.keywords ?? resolveKeywords();
      const per = Math.min(Math.max(opts?.resultsPerKeyword ?? 5, 1), 10);
      const posts: SocialPost[] = [];

      for (const kw of keywords.slice(0, 5)) {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", `${kw} ${googleQuerySuffix(locale)}`);
        url.searchParams.set("num", String(per));
        if (loc.googleLr) url.searchParams.set("lr", loc.googleLr);
        if (loc.googleGl) url.searchParams.set("gl", loc.googleGl);
        if (loc.googleHl) url.searchParams.set("hl", loc.googleHl);

        const res = await fetchJson<GoogleCseResponse>(url.toString(), {
          fetchFn: opts?.fetchFn,
        });
        if (!res.ok) {
          logWarn("google-cse adapter error", {
            worker: "discovery-social-scout",
            keyword: kw,
            status: res.status,
          });
          return errorResult(`Google CSE HTTP ${res.status}`);
        }

        for (const item of res.data.items ?? []) {
          const link = item.link ?? "";
          const snippet = [item.title, item.snippet].filter(Boolean).join(" — ");
          posts.push({
            platform: "google",
            externalId: item.cacheId ?? link,
            permalink: link || undefined,
            feedLabel: `google-cse:${kw}`,
            text: `${snippet} ${link}`.trim(),
            attachmentUrls: link ? [link] : [],
            observedAt: new Date().toISOString(),
          });
        }
      }

      return okResult(posts);
    },
  };
}

interface GoogleCseResponse {
  items?: Array<{
    title?: string;
    link?: string;
    snippet?: string;
    cacheId?: string;
  }>;
}
