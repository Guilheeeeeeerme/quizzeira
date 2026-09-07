import { workerEnv } from "./env";
import type { LlmProvider, ProviderCompleteInput } from "./gemini";

type OpenAiResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function openaiComplete(input: ProviderCompleteInput): Promise<string> {
  if (!workerEnv.openaiApiKey) {
    throw new Error("OPENAI_API_KEY not set");
  }
  const res = await fetch(`${workerEnv.openaiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${workerEnv.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      response_format: { type: "json_object" },
      temperature: input.temperature ?? 0.2,
    }),
  });
  const data = (await res.json()) as OpenAiResponse;
  if (!res.ok) {
    const message = data.error?.message ?? "request failed";
    throw new Error(`OpenAI ${res.status}: ${message}`);
  }
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Empty OpenAI response");
  return text;
}

export const openaiProvider: LlmProvider = {
  name: "openai",
  available: () => Boolean(workerEnv.openaiApiKey),
  defaultModel: () => workerEnv.openaiModel,
  complete: openaiComplete,
};
