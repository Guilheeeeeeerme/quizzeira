import { workerEnv } from "./env";

export type ProviderName = "gemini" | "openai";

export interface RankedModel {
  provider: ProviderName;
  model: string;
  inputUsdPerMillion: number;
}

export const SEED_TABLE: readonly RankedModel[] = [
  { provider: "gemini", model: "gemini-2.5-flash-lite", inputUsdPerMillion: 0.1 },
  { provider: "gemini", model: "gemini-2.5-flash", inputUsdPerMillion: 0.3 },
  { provider: "openai", model: "gpt-5-nano", inputUsdPerMillion: 0.05 },
  { provider: "openai", model: "gpt-4.1-nano", inputUsdPerMillion: 0.1 },
  { provider: "openai", model: "gpt-4o-mini", inputUsdPerMillion: 0.15 },
];

const OPENAI_NON_TEXT = /embedding|whisper|tts|dall-e|moderation|audio|image|transcribe|realtime|search|codex/i;
const OPENAI_TEXT_PATTERN = /^(gpt-|o\d)/;

export function filterTextGenOpenai(modelIds: readonly string[]): string[] {
  return modelIds.filter(
    (id) => OPENAI_NON_TEXT.test(id) === false && OPENAI_TEXT_PATTERN.test(id),
  );
}

interface GeminiModelEntry {
  name: string;
  supportedGenerationMethods: string[];
}

export function filterTextGenGemini(entries: readonly GeminiModelEntry[]): string[] {
  return entries
    .filter((entry) => entry.supportedGenerationMethods.includes("generateContent"))
    .map((entry) => entry.name.replace(/^models\//, ""))
    .filter((id) => /embedding|aqa|imagen|veo|tts/i.test(id) === false);
}

export function buildRank(
  provider: ProviderName,
  seeds: readonly RankedModel[],
  discovered: readonly string[],
  defaultModel: string,
  topN: number,
): string[] {
  const limit = Math.max(1, Math.floor(topN));
  const rank = [defaultModel];
  const chosen = new Set(rank);
  const pool = [
    ...seeds.filter((seed) => seed.provider === provider),
    ...discovered.map((model) => ({
      provider,
      model,
      inputUsdPerMillion: Number.POSITIVE_INFINITY,
    })),
  ]
    .sort(
      (a, b) =>
        a.inputUsdPerMillion - b.inputUsdPerMillion ||
        a.model.localeCompare(b.model),
    )
    .slice(0, limit + 1);
  for (const entry of pool) {
    if (rank.length >= limit) break;
    if (!chosen.has(entry.model)) {
      rank.push(entry.model);
      chosen.add(entry.model);
    }
  }
  return rank;
}

let catalog: RankedModel[] = [...SEED_TABLE];
let scheduled = false;
let refreshing = false;

function defaultModelFor(provider: ProviderName): string {
  if (provider === "gemini") return workerEnv.geminiModel;
  return workerEnv.openaiModel;
}

async function fetchGeminiCatalog(): Promise<RankedModel[]> {
  const res = await fetch(
    `${workerEnv.geminiBaseUrl}/v1beta/models`,
    { headers: { "x-goog-api-key": workerEnv.geminiApiKey } },
  );
  if (!res.ok) throw new Error(`Gemini models.list ${res.status}`);
  const data = (await res.json()) as { models?: GeminiModelEntry[] };
  return filterTextGenGemini(data.models ?? []).map((model) => ({
    provider: "gemini",
    model,
    inputUsdPerMillion: Number.POSITIVE_INFINITY,
  }));
}

async function fetchOpenaiCatalog(): Promise<RankedModel[]> {
  const res = await fetch(`${workerEnv.openaiBaseUrl}/models`, {
    headers: { authorization: `Bearer ${workerEnv.openaiApiKey}` },
  });
  if (!res.ok) throw new Error(`OpenAI models.list ${res.status}`);
  const data = (await res.json()) as { data?: Array<{ id?: string }> };
  return filterTextGenOpenai(
    (data.data ?? []).map((entry) => entry.id ?? "").filter(Boolean),
  ).map((model) => ({
    provider: "openai",
    model,
    inputUsdPerMillion: Number.POSITIVE_INFINITY,
  }));
}

async function refreshCatalog(): Promise<void> {
  if (refreshing) return;
  refreshing = true;
  try {
    const providers: ProviderName[] = ["gemini", "openai"];
    const fetched = await Promise.all(
      providers.map(async (provider) => {
        try {
          if (
            provider === "gemini" ? !workerEnv.geminiApiKey : !workerEnv.openaiApiKey
          ) {
            return [];
          }
          return provider === "gemini"
            ? await fetchGeminiCatalog()
            : await fetchOpenaiCatalog();
        } catch {
          return [];
        }
      }),
    );
    const merged = new Map(
      catalog.map((entry) => [`${entry.provider}:${entry.model}`, entry]),
    );
    for (const entry of fetched.flat()) {
      merged.set(`${entry.provider}:${entry.model}`, entry);
    }
    catalog = [...merged.values()];
  } finally {
    refreshing = false;
  }
}

function ensureScheduled(): void {
  if (scheduled) return;
  scheduled = true;
  void refreshCatalog();
  const timer = setInterval(
    () => void refreshCatalog(),
    workerEnv.modelRankRefreshMs,
  );
  timer.unref?.();
}

export function rankFor(provider: ProviderName): string[] {
  ensureScheduled();
  return buildRank(
    provider,
    catalog,
    [],
    defaultModelFor(provider),
    workerEnv.modelRankTopN,
  );
}

export type ModelTier = "cheap" | "mid" | "strong";

const TIER_MODELS: Record<ModelTier, Partial<Record<ProviderName, string[]>>> = {
  cheap: {
    gemini: ["gemini-2.5-flash-lite"],
    openai: ["gpt-5-nano", "gpt-4.1-nano"],
  },
  mid: {
    gemini: ["gemini-2.5-flash", "gemini-2.5-flash-lite"],
    openai: ["gpt-4o-mini", "gpt-4.1-nano"],
  },
  strong: {
    gemini: ["gemini-2.5-flash", "gemini-2.5-pro"],
    openai: ["gpt-4o", "gpt-4o-mini"],
  },
};

/** Rank models within a requested tier, falling back to cost rank. */
export function rankForTier(provider: ProviderName, tier: ModelTier = "mid"): string[] {
  ensureScheduled();
  const preferred = TIER_MODELS[tier][provider] ?? [];
  const fallback = rankFor(provider);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const model of [...preferred, ...fallback]) {
    if (seen.has(model)) continue;
    seen.add(model);
    out.push(model);
  }
  return out.length > 0 ? out : [defaultModelFor(provider)];
}

export function resetModelRankForTests(): void {
  catalog = [...SEED_TABLE];
  scheduled = true;
  refreshing = false;
}
