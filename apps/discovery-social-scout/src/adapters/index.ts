import { createFacebookGraphAdapter } from "./facebook-graph.js";
import { createFixtureAdapter } from "./fixture.js";
import { createGoogleCseAdapter } from "./google-cse.js";
import { createInstagramGraphAdapter } from "./instagram-graph.js";
import { createRedditPublicAdapter } from "./reddit-public.js";
import { createTelegramPublicAdapter } from "./telegram-public.js";
import { createXPublicAdapter } from "./x-public.js";
import { createYoutubeDataAdapter } from "./youtube-data.js";
import type { SocialSourceAdapter } from "../types.js";

const FACTORIES: Record<string, () => SocialSourceAdapter> = {
  fixture: createFixtureAdapter,
  "telegram-public": createTelegramPublicAdapter,
  "reddit-public": createRedditPublicAdapter,
  "x-public": createXPublicAdapter,
  "google-cse": createGoogleCseAdapter,
  "instagram-graph": createInstagramGraphAdapter,
  "facebook-graph": createFacebookGraphAdapter,
  "youtube-data": createYoutubeDataAdapter,
};

/** Default live adapter set when fixture mode is off and env list is empty. */
export const DEFAULT_LIVE_ADAPTERS = [
  "x-public",
  "google-cse",
  "instagram-graph",
  "facebook-graph",
  "reddit-public",
  "youtube-data",
  "telegram-public",
];

export function resolveAdapters(ids: string[], fixtureMode: boolean): SocialSourceAdapter[] {
  if (fixtureMode) return [createFixtureAdapter()];
  const requested = ids.length ? ids : DEFAULT_LIVE_ADAPTERS;
  const out: SocialSourceAdapter[] = [];
  for (const id of requested) {
    const factory = FACTORIES[id];
    if (factory) out.push(factory());
  }
  return out.length ? out : [createFixtureAdapter()];
}

export {
  createFacebookGraphAdapter,
  createFixtureAdapter,
  createGoogleCseAdapter,
  createInstagramGraphAdapter,
  createRedditPublicAdapter,
  createTelegramPublicAdapter,
  createXPublicAdapter,
  createYoutubeDataAdapter,
};
