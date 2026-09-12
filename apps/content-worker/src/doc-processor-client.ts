import { parseNormalizedDocument, type NormalizedDocument } from "@quizzeira/shared";
import { contentEnv } from "./env.js";

export type ProcessDocumentInput = {
  documentId: string;
  contentType: string;
  bytes: Buffer | Uint8Array;
  url?: string | null;
  roleHint?: string | null;
  kindHint?: string | null;
};

/** Spec §33: doc-processor unreachable — stay pending, no attempts consumed. */
export class ProcessorUnavailableError extends Error {
  readonly code = "processor_unavailable" as const;
  constructor(message: string) {
    super(message);
    this.name = "ProcessorUnavailableError";
  }
}

function isTransportFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound") ||
    msg.includes("etimedout") ||
    msg.includes("network") ||
    msg.includes("socket") ||
    msg.includes("aborted")
  );
}

export async function processDocumentWithDocProcessor(
  input: ProcessDocumentInput,
): Promise<NormalizedDocument> {
  const body = {
    documentId: input.documentId,
    contentType: input.contentType,
    base64: Buffer.from(input.bytes).toString("base64"),
    url: input.url ?? null,
    roleHint: input.roleHint ?? null,
    kindHint: input.kindHint ?? null,
  };

  let res: Response;
  try {
    res = await fetch(`${contentEnv.docProcessorUrl}/process`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  } catch (err) {
    if (isTransportFailure(err) || err instanceof Error) {
      throw new ProcessorUnavailableError(
        `doc-processor unreachable: ${err instanceof Error ? err.message : String(err)}`.slice(
          0,
          300,
        ),
      );
    }
    throw err;
  }

  const text = await res.text();
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new ProcessorUnavailableError(`doc-processor /process ${res.status}: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(`doc-processor /process ${res.status}: ${text.slice(0, 300)}`);
  }

  return parseNormalizedDocument(JSON.parse(text));
}

export async function docProcessorHealth(): Promise<{ ok: boolean; engines: string[] }> {
  let res: Response;
  try {
    res = await fetch(`${contentEnv.docProcessorUrl}/health`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new ProcessorUnavailableError(
      `doc-processor /health unreachable: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new ProcessorUnavailableError(`doc-processor /health ${res.status}`);
  }
  if (!res.ok) {
    throw new Error(`doc-processor /health ${res.status}`);
  }
  return (await res.json()) as { ok: boolean; engines: string[] };
}
