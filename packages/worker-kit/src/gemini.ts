import { workerEnv } from "./env";

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

export interface LlmProvider {
  name: "gemini" | "openai";
  available(): boolean;
  defaultModel(): string;
  complete(input: ProviderCompleteInput): Promise<string>;
}

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message?: string };
};

async function geminiRequest(input: ProviderCompleteInput): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    temperature: input.temperature ?? 0.2,
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
  return text;
}

export async function geminiComplete(input: ProviderCompleteInput): Promise<string> {
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
