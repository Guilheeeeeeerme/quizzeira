import { logInfo } from "@quizzeira/worker-kit";
import { resolveAdapters } from "./adapters/index.js";
import { analyzePost } from "./detect.js";
import { socialEnv } from "./env.js";
import { handoffFile } from "./handoff.js";
import type { AdapterFetchResult, ScoutHandoffResult, SocialSignal } from "./types.js";

const NAME = "discovery-social-scout";

export interface AdapterStatusRow {
  id: string;
  status: AdapterFetchResult["status"];
  detail?: string;
  posts: number;
}

export interface SocialPassSummary {
  posts: number;
  signals: number;
  filesProposed: number;
  adapters: AdapterStatusRow[];
  handoffs: ScoutHandoffResult[];
}

/** One scout pass: adapters → detect → Discovery handoff. */
export async function runSocialScoutPass(): Promise<SocialPassSummary> {
  const adapters = resolveAdapters(socialEnv.adapters, socialEnv.fixtureMode);
  const posts = [];
  const adapterRows: AdapterStatusRow[] = [];

  for (const adapter of adapters) {
    const result = await adapter.fetchRecent();
    adapterRows.push({
      id: adapter.id,
      status: result.status,
      detail: result.detail,
      posts: result.posts.length,
    });
    posts.push(...result.posts);
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
    adapters: adapterRows,
  });

  return {
    posts: limited.length,
    signals: signals.length,
    filesProposed,
    adapters: adapterRows,
    handoffs,
  };
}
