/** Normalize stage: call doc-processor and persist NormalizedDocument (§13). */

import {
  classifyDocumentRole,
  classifySectionRole,
  emptyNormalizedDocument,
  normalizeHtmlDocument,
  scoreSection,
  sectionText,
} from "@quizzeira/shared";
import { logWarn } from "@quizzeira/worker-kit";
import { content } from "../clients.js";
import { processDocument } from "../doc-processor-client.js";
import { contentEnv } from "../env.js";

const NAME = "content-worker/normalize";

export async function normalizeDocument(input: {
  documentId: string;
  contentType: string | null;
  sourceUrl: string | null;
  buffer: Buffer;
  kindHint?: string | null;
  roleHint?: string | null;
}): Promise<{ role: string; sections: number; textChars: number }> {
  let normalized;
  try {
    normalized = await processDocument({
      contentType: input.contentType || "application/octet-stream",
      filename: input.sourceUrl?.split("/").pop(),
      buffer: input.buffer,
      hints: { url: input.sourceUrl },
    });
  } catch (err) {
    logWarn("doc-processor unavailable; local HTML/text fallback", {
      worker: NAME,
      error: err instanceof Error ? err.message : String(err),
      docProcessorUrl: contentEnv.docProcessorUrl,
    });
    const ctype = input.contentType || "";
    if (/html/i.test(ctype)) {
      const local = normalizeHtmlDocument(input.buffer.toString("utf8"));
      const sections = sectionText(local.text);
      normalized = emptyNormalizedDocument({
        contentType: ctype,
        text: local.text,
        sections: sections.map((s) => ({
          ordinal: s.ordinal,
          path: s.path,
          heading: s.heading,
          level: s.level,
          text: s.text,
        })),
        cleaningLog: local.events,
        extractor: "node-fallback",
        stats: { charCount: local.text.length },
      });
    } else {
      const text = input.buffer.toString("utf8");
      normalized = emptyNormalizedDocument({
        contentType: ctype || "text/plain",
        text,
        extractor: "node-fallback",
        stats: { charCount: text.length },
      });
    }
  }

  const role = classifyDocumentRole({
    url: input.sourceUrl,
    kindHint: input.kindHint,
    roleHint: input.roleHint,
    text: normalized.text,
  });

  const sections = (normalized.sections?.length
    ? normalized.sections
    : sectionText(normalized.text).map((s) => ({
        ordinal: s.ordinal,
        path: s.path,
        heading: s.heading,
        level: s.level,
        text: s.text,
      }))
  ).map((s) => {
    const sectionRole = classifySectionRole(s.heading, s.text);
    const scores = scoreSection(s.text);
    return {
      ordinal: s.ordinal,
      path: s.path,
      heading: s.heading,
      level: s.level,
      text: s.text,
      role: sectionRole,
      scores,
      charCount: s.text.length,
    };
  });

  await content.post(`/internal/documents/${input.documentId}/normalize`, {
    role: role.role,
    roleConfidence: role.confidence,
    roleMethod: role.method,
    subtype: role.subtype ?? null,
    language: normalized.language,
    normalizerVersion: normalized.version,
    stats: normalized.stats,
    text: normalized.text,
    sections,
    normalized: normalized,
  });

  return { role: role.role, sections: sections.length, textChars: normalized.text.length };
}
