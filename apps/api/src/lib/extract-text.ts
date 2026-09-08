import type { AttachmentKind } from "@prisma/client";
import { excerptForAttachmentStore } from "./fetch-url.js";

/** Raw PDF/text parse budget before study-context store excerpt. */
const RAW_EXTRACT_MAX_CHARS = 500_000;

export function attachmentKindFromMime(mimeType: string, filename: string): AttachmentKind {
  const lower = mimeType.toLowerCase();
  const name = filename.toLowerCase();
  if (lower.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp)$/.test(name)) return "IMAGE";
  if (lower === "application/pdf" || name.endsWith(".pdf")) return "PDF";
  return "TEXT";
}

export async function extractAttachmentText(
  kind: AttachmentKind,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  if (kind === "IMAGE") return null;
  if (kind === "TEXT" || mimeType.startsWith("text/") || mimeType.includes("json")) {
    return buffer.toString("utf8").slice(0, RAW_EXTRACT_MAX_CHARS);
  }
  if (kind === "PDF") {
    try {
      const pdfParse = (await import("pdf-parse")).default as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      const raw = (parsed.text ?? "").trim();
      if (!raw) return null;
      return raw.length > RAW_EXTRACT_MAX_CHARS ? raw.slice(0, RAW_EXTRACT_MAX_CHARS) : raw;
    } catch {
      return null;
    }
  }
  return null;
}

/** Extract then keep syllabus-preferring store excerpt (not PDF head alone). */
export async function extractAndStoreAttachmentText(
  kind: AttachmentKind,
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  const raw = await extractAttachmentText(kind, buffer, mimeType);
  return excerptForAttachmentStore(raw);
}
