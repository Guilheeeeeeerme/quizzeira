import type { AttachmentKind } from "@prisma/client";

const MAX_CHARS = 40_000;

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
    return buffer.toString("utf8").slice(0, MAX_CHARS);
  }
  if (kind === "PDF") {
    try {
      const pdfParse = (await import("pdf-parse")).default as (buf: Buffer) => Promise<{ text: string }>;
      const parsed = await pdfParse(buffer);
      return (parsed.text ?? "").trim().slice(0, MAX_CHARS) || null;
    } catch {
      return null;
    }
  }
  return null;
}
