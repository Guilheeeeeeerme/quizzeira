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

  const res = await fetch(`${contentEnv.docProcessorUrl}/process`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`doc-processor /process ${res.status}: ${text.slice(0, 300)}`);
  }

  return parseNormalizedDocument(JSON.parse(text));
}

export async function docProcessorHealth(): Promise<{ ok: boolean; engines: string[] }> {
  const res = await fetch(`${contentEnv.docProcessorUrl}/health`);
  if (!res.ok) {
    throw new Error(`doc-processor /health ${res.status}`);
  }
  return (await res.json()) as { ok: boolean; engines: string[] };
}
