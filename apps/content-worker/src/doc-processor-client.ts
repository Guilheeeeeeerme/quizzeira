/** Content-worker client for Python doc-processor (§12). */

import { contentEnv } from "./env.js";

export interface DocProcessorResult {
  version: string;
  contentType: string;
  language: string;
  title: string | null;
  text: string;
  sections: Array<{
    ordinal: number;
    path: string[];
    heading: string | null;
    level: number;
    text: string;
  }>;
  tables: unknown[];
  stats: Record<string, unknown>;
  cleaningLog: Array<{ rule: string; removedChars: number }>;
  extractor: string;
  extractedAt: string;
}

export async function processDocument(input: {
  contentType: string;
  filename?: string;
  buffer: Buffer;
  hints?: Record<string, unknown>;
}): Promise<DocProcessorResult> {
  const base = contentEnv.docProcessorUrl?.replace(/\/$/, "") || "http://127.0.0.1:8090";
  const res = await fetch(`${base}/process`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contentType: input.contentType,
      filename: input.filename,
      base64: input.buffer.toString("base64"),
      hints: input.hints ?? {},
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`doc-processor ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as DocProcessorResult;
}
