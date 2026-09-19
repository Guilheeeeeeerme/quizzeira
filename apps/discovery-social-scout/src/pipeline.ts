import { logInfo } from "@quizzeira/worker-kit";
import { resolveAdapters } from "./adapters/index.js";
import { analyzePost } from "./detect.js";
import { socialEnv } from "./env.js";
import { handoffFile } from "./handoff.js";
import type { ScoutHandoffResult, SocialSignal } from "./types.js";

const NAME = "discovery-social-scout";

export interface SocialPassSummary {
  posts: number;
  signals: number;
  filesProposed: number;
  handoffs: ScoutHandoffResult[];
}

/** One scout pass: adapters → detect → Discovery handoff. */
export async function runSocialScoutPass(): Promise<SocialPassSummary> {
  const adapters = resolveAdapters(socialEnv.adapters, socialEnv.fixtureMode);
  const posts = [];
  for (const adapter of adapters) {
    const batch = await adapter.fetchRecent();
    posts.push(...batch);
  }
  const limited = posts.slice(0, socialEnv.maxPostsPerPass);

  const signals: SocialSignal[] = [];
  for (const post of limited) {
    const signal = analyzePost(post);
    if (signal.examRelevant || signal.files.length) signals.push(signal);
  }

  const handoffs: ScoutHandoffResult[] = [];
  let filesProposed = 0;
  for (const signal of signals) {
    for (const file of signal.files) {
      if (filesProposed >= socialEnv.maxFilesPerPass) break;
      const result = await handoffFile(signal, file, {
        storeUrlArtifacts: socialEnv.storeUrlArtifacts,
      });
      handoffs.push(result);
      if (result.action === "scout_candidate") filesProposed += 1;
    }
  }

  logInfo("social scout pass", {
    worker: NAME,
    posts: limited.length,
    signals: signals.length,
    filesProposed,
    adapters: adapters.map((a) => a.id),
  });

  return {
    posts: limited.length,
    signals: signals.length,
    filesProposed,
    handoffs,
  };
}
