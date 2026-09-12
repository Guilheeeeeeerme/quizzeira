// Concept: Embeddings (chunk text → vector, stored in pgvector)
//
// Provider order mirrors worker-kit's LLM_PROVIDER_ORDER so a deployment that
// only has one key configured still works. Dimensions must match the
// vector(768) column, which is why the OpenAI call pins `dimensions`.
import { logInfo, logWarn, workerEnv } from "@quizzeira/worker-kit";
import { content } from "../clients.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/embeddings";

export interface EmbeddingPassResult {
  embedded: number;
  failed: number;
}

export function hasEmbeddingProvider(): boolean {
  return Boolean(workerEnv.geminiApiKey || workerEnv.openaiApiKey);
}

export async function runEmbeddingPass(): Promise<EmbeddingPassResult> {
  const result: EmbeddingPassResult = { embedded: 0, failed: 0 };
  if (!hasEmbeddingProvider()) {
    logWarn("no embedding provider configured", { worker: NAME });
    return result;
  }

  const { items } = await content.get<{
    items: Array<{ id: string; text: string; documentId: string }>;
  }>(`/internal/embeddings/queue?limit=${contentEnv.chunksPerEmbedPass}`);

  for (const chunk of items) {
    try {
      const embedding = await embedText(chunk.text);
      await content.put(`/internal/chunks/${chunk.id}/embedding`, { embedding });
      result.embedded += 1;
    } catch (err) {
      result.failed += 1;
      logWarn("embedding failed", {
        worker: NAME,
        chunkId: chunk.id,
        error: err instanceof Error ? err.message : String(err),
      });
      // A provider outage will fail every remaining chunk the same way; stop
      // the pass instead of burning the whole queue on it.
      break;
    }
  }

  if (result.embedded || result.failed) logInfo("embedding pass", { worker: NAME, ...result });
  return result;
}

export async function embedText(text: string): Promise<number[]> {
  const order = workerEnv.llmProviderOrder.split(",").map((p) => p.trim().toLowerCase());
  let lastError: Error | null = null;

  for (const provider of order) {
    try {
      if (provider === "gemini" && workerEnv.geminiApiKey) return await embedGemini(text);
      if (provider === "openai" && workerEnv.openaiApiKey) return await embedOpenai(text);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error("no embedding provider available");
}

async function embedGemini(text: string): Promise<number[]> {
  const model = contentEnv.geminiEmbeddingModel;
  const res = await fetch(
    `${workerEnv.geminiBaseUrl}/v1beta/models/${model}:embedContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": workerEnv.geminiApiKey,
      },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text }] },
        outputDimensionality: contentEnv.embeddingDimensions,
      }),
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!res.ok) {
    throw new Error(`gemini embed ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  const json = (await res.json()) as { embedding?: { values?: number[] } };
  return assertDimensions(json.embedding?.values ?? []);
}

async function embedOpenai(text: string): Promise<number[]> {
  const res = await fetch(`${workerEnv.openaiBaseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${workerEnv.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: contentEnv.openaiEmbeddingModel,
      input: text,
      dimensions: contentEnv.embeddingDimensions,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`openai embed ${res.status}: ${(await res.text()).slice(0, 160)}`);
  }
  const json = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  return assertDimensions(json.data?.[0]?.embedding ?? []);
}

function assertDimensions(embedding: number[]): number[] {
  if (embedding.length !== contentEnv.embeddingDimensions) {
    throw new Error(
      `embedding has ${embedding.length} dims, column expects ${contentEnv.embeddingDimensions}`,
    );
  }
  return embedding;
}
