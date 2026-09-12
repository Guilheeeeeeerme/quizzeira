// Concept: Recorded-response LLM provider for integration tests (§47 / §41.3).

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { LlmCompletion, LlmProvider, ProviderCompleteInput } from "../gemini";

export interface FixtureTurn {
  /** Optional stable key: `${promptVersion}:${logicalId}` or payload hash. */
  key?: string;
  /** Substring that must appear in the user prompt (fallback matcher). */
  match?: string;
  /** JSON-serializable object returned as the model response. */
  response: unknown;
}

/**
 * Deterministic provider: prefers `key` equality, then first `match` substring.
 * Enable with `LLM_PROVIDER=fixture` or provider order `fixture`.
 */
export function createFixtureProvider(turns: FixtureTurn[] = defaultTurns()): LlmProvider {
  return {
    name: "fixture",
    available: () =>
      process.env.LLM_PROVIDER === "fixture" ||
      (process.env.LLM_PROVIDER_ORDER ?? "")
        .split(",")
        .map((s) => s.trim())
        .includes("fixture"),
    defaultModel: () => "fixture-v1",
    async complete(input: ProviderCompleteInput): Promise<LlmCompletion> {
      const haystack = `${input.system}\n${input.user}`;
      const explicitKey = input.model?.startsWith("fixture:")
        ? input.model.slice("fixture:".length)
        : null;
      const hashed = fixturePayloadKey(haystack);
      const hit =
        turns.find((t) => t.key && (t.key === explicitKey || t.key === hashed)) ??
        turns.find((t) => t.match && haystack.includes(t.match));
      if (!hit) {
        throw new Error("fixture provider: no recorded turn matched prompt");
      }
      const text = JSON.stringify(hit.response);
      return {
        text,
        usage: {
          promptTokens: Math.ceil(haystack.length / 4),
          completionTokens: Math.ceil(text.length / 4),
          totalTokens: Math.ceil((haystack.length + text.length) / 4),
        },
      };
    },
  };
}

export const fixtureProvider = createFixtureProvider();

/** §41.3: promptVersion + fenced payload hash for recorded-turn lookup. */
export function fixturePayloadKey(prompt: string, promptVersion = "generation.v2"): string {
  const fenced =
    prompt.match(/--- IN[IÍ]CIO[\s\S]*?--- FIM ---/i)?.[0] ?? prompt.slice(0, 400);
  const digest = createHash("sha256").update(fenced).digest("hex").slice(0, 12);
  return `${promptVersion}:${digest}`;
}

function defaultTurns(): FixtureTurn[] {
  const raw = process.env.LLM_FIXTURE_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as FixtureTurn[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  const fromFile = loadCheckedInTurns();
  if (fromFile.length > 0) return fromFile;
  return [
    {
      key: "generation.v2:concordancia",
      match: "unidades de conhecimento",
      response: {
        questions: [
          {
            type: "MULTIPLE_CHOICE",
            prompt: "Sobre concordância verbal, assinale a alternativa correta.",
            options: [
              "O verbo concorda com o sujeito em número e pessoa.",
              "O verbo nunca concorda com o sujeito.",
              "Sujeito composto anteposto exige singular.",
              "Haver no sentido de existir vai ao plural.",
              "Fazer indicando tempo pluraliza-se.",
            ],
            correctIndex: 0,
            explanation: "Regra geral de concordância.",
            syllabusNodeId: "leaf",
            knowledgeUnitIds: ["ku-1"],
            distractorRationale: [
              "nega a regra",
              "inverte composto",
              "haver existencial é singular",
              "fazer tempo é impessoal",
            ],
            passage: null,
            difficulty: 0.5,
            bloom: "apply",
          },
        ],
      },
    },
  ];
}

function loadCheckedInTurns(): FixtureTurn[] {
  const candidates = [
    resolve(process.cwd(), "packages/worker-kit/fixtures/llm-turns.json"),
    resolve(__dirname, "../../fixtures/llm-turns.json"),
  ];
  for (const path of candidates) {
    try {
      if (!existsSync(path)) continue;
      const parsed = JSON.parse(readFileSync(path, "utf8")) as FixtureTurn[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* try next */
    }
  }
  return [];
}
