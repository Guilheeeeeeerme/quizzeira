import { createFixtureAdapter } from "./fixture.js";
import { createRedditPublicAdapter } from "./reddit-public.js";
import { createTelegramPublicAdapter } from "./telegram-public.js";
import type { SocialSourceAdapter } from "../types.js";

export function resolveAdapters(ids: string[], fixtureMode: boolean): SocialSourceAdapter[] {
  if (fixtureMode) return [createFixtureAdapter()];
  const out: SocialSourceAdapter[] = [];
  for (const id of ids) {
    switch (id) {
      case "fixture":
        out.push(createFixtureAdapter());
        break;
      case "telegram-public":
        out.push(createTelegramPublicAdapter());
        break;
      case "reddit-public":
        out.push(createRedditPublicAdapter());
        break;
      default:
        break;
    }
  }
  return out.length ? out : [createFixtureAdapter()];
}

export { createFixtureAdapter, createTelegramPublicAdapter, createRedditPublicAdapter };
