// Concept: Normalize via doc-processor (§12) with Node HTML fallback.
import { decodeHtmlBytes, normalizeHtml, normalizePlainText, type NormalizedDocument } from "@quizzeira/shared";
import { logWarn } from "@quizzeira/worker-kit";
import { content } from "../clients.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/normalize";

interface QueuedDocument {
  id: string;
  examSlug: string;
  kind: string;
  role?: string;
  sourceUrl: string | null;
  storageKey: string | null;
  contentType: string | null;
  attempts: number;
}

export async function normalizeDocument(document: QueuedDocument): Promise<NormalizedDocument | null> {
  const { base64, contentType } = await content.get<{ base64: string; contentType?: string }>(
    `/internal/documents/${document.id}/bytes`,
  );
  const buf = Buffer.from(base64, "base64");
  const ct = contentType || document.contentType || "application/octet-stream";

  const fromProcessor = await callDocProcessor(buf, document, ct);
  if (fromProcessor) return fromProcessor;

  if (/html/i.test(ct) || buf.slice(0, 64).toString("utf8").includes("<html")) {
    const decoded = decodeHtmlBytes(buf, ct);
    return normalizeHtml({
      documentId: document.id,
      html: decoded.html,
      url: document.sourceUrl,
      contentType: ct,
      byteSize: buf.byteLength,
    });
  }
  if (/text\//i.test(ct)) {
    return normalizePlainText({
      documentId: document.id,
      text: buf.toString("utf8"),
      url: document.sourceUrl,
      contentType: ct,
    });
  }
  logWarn("normalize fallback unavailable for binary", { worker: NAME, id: document.id, ct });
  return null;
}

async function callDocProcessor(
  buf: Buffer,
  document: QueuedDocument,
  contentType: string,
): Promise<NormalizedDocument | null> {
  const url = contentEnv.docProcessorUrl;
  if (!url) return null;
  try {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(buf)]), "document.bin");
    form.append("document_id", document.id);
    if (document.sourceUrl) form.append("source_url", document.sourceUrl);
    form.append("content_type", contentType);
    if (document.role) form.append("role_hint", document.role);
    const res = await fetch(`${url}/process`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });
    if (!res.ok) {
      logWarn("doc-processor error", { worker: NAME, status: res.status });
      return null;
    }
    return (await res.json()) as NormalizedDocument;
  } catch (err) {
    logWarn("doc-processor unavailable", {
      worker: NAME,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
