// Concept: Fire-and-forget StageMetric increments from workers (§31.1).

import { content } from "./clients.js";

export async function emitStageMetric(input: {
  stage: string;
  decision: string;
  reason?: string;
  durationMs?: number;
  tokensIn?: number;
  tokensOut?: number;
}): Promise<void> {
  try {
    // §12 Next item 4: tag with this instance's own SERVICE_NAME so a
    // shadow-profile split (documents/embeddings/generation) can be told
    // apart from the monolith in the same StageMetric rows.
    await content.post("/internal/stage-metrics", {
      ...input,
      service: process.env.SERVICE_NAME || "",
    });
  } catch {
    // Metrics must never fail the pipeline.
  }
}
