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

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message?: string };
};

export async function generateJson<T>(
  system: string,
  user: string,
  opts?: { googleSearch?: boolean; temperature?: number },
): Promise<T> {
  if (!workerEnv.geminiApiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const generationConfig: Record<string, unknown> = {
    temperature: opts?.temperature ?? 0.2,
  };
  if (!opts?.googleSearch) {
    generationConfig.responseMimeType = "application/json";
  }

  const payload: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig,
  };
  if (opts?.googleSearch) {
    payload.tools = [{ googleSearch: {} }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${workerEnv.geminiModel}:generateContent`;
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
    if (opts?.googleSearch && res.status === 429) {
      console.warn("[gemini] search grounding quota hit, retrying without search");
      return generateJson<T>(system, user, { ...opts, googleSearch: false });
    }
    throw new Error(`Gemini ${res.status}: ${message}`);
  }
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim() ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return extractJson<T>(text);
}
