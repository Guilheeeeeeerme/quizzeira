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
    await content.post("/internal/stage-metrics", input);
  } catch {
    // Metrics must never fail the pipeline.
  }
}
