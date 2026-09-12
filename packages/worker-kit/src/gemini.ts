import { workerEnv } from "./env";

/**
 * Hard ceilings on a single provider call. Without them one request can run
 * until the provider gives up and can emit unbounded output tokens, which is
 * the cost-asymmetry half of OWASP LLM06.
 */
export const REQUEST_TIMEOUT_MS = 60_000;
export const MAX_OUTPUT_TOKENS = 8_192;

export function extractJson<T>(text: string): T {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < 0) {
    throw new Error("No JSON object in model response");
  }
  return JSON.parse(trimmed.slice(start, end + 1)) as T;
}

export interface ProviderCompleteInput {
  system: string;
  user: string;
  model: string;
  temperature?: number;
  grounding?: boolean;
}

export interface LlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface LlmCompletion {
  text: string;
  usage: LlmUsage;
}

export interface LlmProvider {
  name: "gemini" | "openai";
  available(): boolean;
  defaultModel(): string;
  complete(input: ProviderCompleteInput): Promise<LlmCompletion>;
}

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: { message?: string };
};

async function geminiRequest(input: ProviderCompleteInput): Promise<LlmCompletion> {
  const generationConfig: Record<string, unknown> = {
    temperature: input.temperature ?? 0.2,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  };
  if (!input.grounding) {
    generationConfig.responseMimeType = "application/json";
  }

  const payload: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: input.system }] },
    contents: [{ role: "user", parts: [{ text: input.user }] }],
    generationConfig,
  };
  if (input.grounding) {
    payload.tools = [{ googleSearch: {} }];
  }

  const url = `${workerEnv.geminiBaseUrl}/v1beta/models/${input.model}:generateContent`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-goog-api-key": workerEnv.geminiApiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const data = (await res.json()) as GeminiResponse;
  if (!res.ok) {
    const message = data.error?.message ?? "request failed";
    if (input.grounding && res.status === 429) {
      console.warn("[gemini] search grounding quota hit, retrying without search");
      return geminiRequest({ ...input, grounding: false });
    }
    throw new Error(`Gemini ${res.status}: ${message}`);
  }
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) throw new Error("Empty Gemini response");
  const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
  const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
  const totalTokens =
    data.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens;
  return {
    text,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: totalTokens || 1,
    },
  };
}

export async function geminiComplete(input: ProviderCompleteInput): Promise<LlmCompletion> {
  if (!workerEnv.geminiApiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }
  return geminiRequest(input);
}

export const geminiProvider: LlmProvider = {
  name: "gemini",
  available: () => Boolean(workerEnv.geminiApiKey),
  defaultModel: () => workerEnv.geminiModel,
  complete: geminiComplete,
};
