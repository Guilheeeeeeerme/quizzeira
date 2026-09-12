// Concept: Extraction (one pass: Discovery artifacts → Documents → Chunks)
import { logInfo, logWarn } from "@quizzeira/worker-kit";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";
import { chunkText } from "./chunk.js";
import { extractMcqs } from "./mcq.js";
import {
  extractLayoutText,
  extractOabDocument,
  isOabExamSlug,
  type OabDocumentRef,
  type OabExtractionDeps,
} from "./oab/index.js";
import { extractHtmlText, extractPdfText } from "./pdf-text.js";

const NAME = "content-worker/extraction";

/** Kinds that already contain questions, so they are recovered, not generated. */
const PAST_EXAM_KINDS = new Set(["prova", "gabarito", "past_exam"]);

interface DiscoveryArtifact {
  id: string;
  examSlug: string | null;
  examTitle: string | null;
  kind: string;
  url: string | null;
  storageKey: string | null;
  checksum: string | null;
  contentType: string | null;
}

interface QueuedDocument {
  id: string;
  examSlug: string;
  kind: string;
  sourceUrl: string | null;
  storageKey: string | null;
  contentType: string | null;
  attempts: number;
}

export interface ExtractionPassResult {
  imported: number;
  extracted: number;
  failed: number;
  chunks: number;
  /** Draft questions recovered verbatim from past exams. */
  drafted: number;
}

export async function runExtractionPass(): Promise<ExtractionPassResult> {
  const result: ExtractionPassResult = {
    imported: 0,
    extracted: 0,
    failed: 0,
    chunks: 0,
    drafted: 0,
  };

  result.imported = await importDiscoveryArtifacts();

  const { items } = await content.get<{ items: QueuedDocument[] }>(
    `/internal/extraction/queue?limit=${contentEnv.docsPerPass}`,
  );

  for (const document of items) {
    try {
      await content.patch(`/internal/documents/${document.id}`, {
        status: "extracting",
        bumpAttempts: true,
      });
      const payload = await documentPayload(document);
      const text = payload.text;
      const chunks = chunkText(text, {
        targetChars: contentEnv.chunkTargetChars,
        overlapChars: contentEnv.chunkOverlapChars,
        maxChunks: contentEnv.maxChunksPerDocument,
      });

      if (chunks.length === 0) {
        // Most often an image-only PDF. Marked failed so it stops being retried
        // and shows up in admin instead of silently vanishing.
        await content.patch(`/internal/documents/${document.id}`, {
          status: "failed",
          failReason: "no extractable text (image-only PDF?)",
        });
        result.failed += 1;
        continue;
      }

      const posted = await content.post<{ chunkCount: number }>(
        `/internal/documents/${document.id}/chunks`,
        { chunks },
      );
      result.extracted += 1;
      result.chunks += posted.chunkCount;

      if (isOabExamSlug(document.examSlug)) {
        result.drafted += await draftOabQuestions(document, payload.buffer);
      } else if (PAST_EXAM_KINDS.has(document.kind)) {
        result.drafted += await draftPastExamQuestions(document, text);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      result.failed += 1;
      logWarn("extraction failed", { worker: NAME, documentId: document.id, error: message });
      await content
        .patch(`/internal/documents/${document.id}`, {
          status: "failed",
          failReason: message.slice(0, 400),
        })
        .catch(() => undefined);
    }
  }

  if (result.imported || result.extracted || result.failed) {
    logInfo("extraction pass", { worker: NAME, ...result });
  }
  return result;
}

/**
 * Copies Discovery's unprocessed artifacts into Content as Documents, then
 * marks them published upstream so the next pass does not re-import them.
 * `published` here means "handed off to Content", not "visible to learners".
 */
async function importDiscoveryArtifacts(): Promise<number> {
  const { items } = await discovery.get<{ items: DiscoveryArtifact[] }>(
    "/internal/artifacts?published=false&limit=25",
  );
  let imported = 0;

  for (const artifact of items) {
    if (!artifact.examSlug) continue;
    try {
      await content.post("/internal/documents", {
        discoveryArtifactId: artifact.id,
        examSlug: artifact.examSlug,
        examTitle: artifact.examTitle,
        kind: artifact.kind,
        sourceUrl: artifact.url,
        storageKey: artifact.storageKey,
        checksum: artifact.checksum,
        contentType: artifact.contentType,
      });
      await discovery.patch(`/internal/artifacts/${artifact.id}`, { published: true });
      imported += 1;
    } catch (err) {
      logWarn("artifact import failed", {
        worker: NAME,
        artifactId: artifact.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return imported;
}

/**
 * Hands an OAB document to the specialized module. The OAB never goes through
 * Generation: its questions are transcribed from the banca's own PDFs and keyed
 * by the banca's own gabarito, so no model is involved and no LLM tokens are
 * spent on them.
 */
async function draftOabQuestions(document: QueuedDocument, bytes: Buffer): Promise<number> {
  const deps: OabExtractionDeps = {
    async listDocuments(examSlug, kind) {
      const { items } = await content.get<{ items: OabDocumentRef[] }>(
        `/internal/documents?examSlug=${encodeURIComponent(examSlug)}&kind=${kind}`,
      );
      return items;
    },
    async documentBytes(documentId) {
      const bytes = await content.get<{ base64: string }>(
        `/internal/documents/${documentId}/bytes`,
      );
      return Buffer.from(bytes.base64, "base64");
    },
    async draft({ examSlug, documentId, group }) {
      const { created } = await content.post<{ created: number }>(
        "/internal/question-items/draft",
        {
          examSlug,
          subject: group.subject,
          locale: "pt",
          origin: "extraction",
          documentId,
          questions: group.questions,
        },
      );
      return created;
    },
  };

  const ref: OabDocumentRef = {
    id: document.id,
    examSlug: document.examSlug,
    kind: document.kind,
    storageKey: document.storageKey,
    sourceUrl: document.sourceUrl,
    contentType: document.contentType,
  };

  const { drafted, pending } = await extractOabDocument(ref, bytes, deps);
  if (pending) {
    // Not a failure: the other half of the pair is usually published weeks
    // later, and the document is re-drafted when it arrives.
    logInfo("oab document awaiting its pair", {
      worker: NAME,
      documentId: document.id,
      examSlug: document.examSlug,
      kind: document.kind,
      reason: pending,
    });
  }
  return drafted;
}

/**
 * Drafts the questions a prova already contains. Needs an answer key, so a
 * prova whose gabarito is a separate artifact yields nothing until that document
 * is extracted too; the material still reaches Generation through its chunks.
 */
async function draftPastExamQuestions(document: QueuedDocument, text: string): Promise<number> {
  const questions = extractMcqs(text);
  if (questions.length === 0) {
    logInfo("no answer key recovered", {
      worker: NAME,
      documentId: document.id,
      kind: document.kind,
    });
    return 0;
  }

  const { created } = await content.post<{ created: number }>("/internal/question-items/draft", {
    examSlug: document.examSlug,
    subject: "geral",
    locale: "pt",
    origin: "extraction",
    documentId: document.id,
    questions: questions.map((question) => ({
      type: "MULTIPLE_CHOICE" as const,
      prompt: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
      referenceAnswer: null,
      explanation: null,
    })),
  });
  return created;
}

interface DocumentPayload {
  /** Raw bytes, kept because the OAB parsers read PDF geometry, not flat text. */
  buffer: Buffer;
  contentType: string;
  text: string;
}

async function documentPayload(document: QueuedDocument): Promise<DocumentPayload> {
  const { buffer, contentType } = await documentBytes(document);
  return { buffer, contentType, text: bytesToText(buffer, contentType, document.examSlug) };
}

async function documentBytes(
  document: QueuedDocument,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (document.storageKey) {
    const bytes = await content.get<{ base64: string; contentType: string }>(
      `/internal/documents/${document.id}/bytes`,
    );
    return {
      buffer: Buffer.from(bytes.base64, "base64"),
      contentType: bytes.contentType || document.contentType || "",
    };
  }

  if (document.sourceUrl) {
    const res = await fetch(document.sourceUrl, {
      headers: { "user-agent": "QuizzeiraContentWorker/0.1 (+https://quizzeira.local)" },
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    return {
      buffer: Buffer.from(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") ?? "",
    };
  }

  throw new Error("document has neither storageKey nor sourceUrl");
}

function bytesToText(buffer: Buffer, contentType: string, examSlug: string): string {
  if (/html/i.test(contentType)) return extractHtmlText(buffer.toString("utf8"));
  const isPdf = buffer.subarray(0, 5).toString("latin1").startsWith("%PDF");
  if (!isPdf && !/pdf/i.test(contentType)) {
    // Prova/gabarito fixtures and crawler HTML-adjacent blobs often land as
    // text/plain; forcing them through the PDF reader yields empty text.
    return buffer.toString("utf8");
  }
  // OAB cadernos are two-column: the flat reader splices question 1 into
  // question 3, so even the chunks stored for Generation come out unusable.
  if (isOabExamSlug(examSlug)) {
    const layout = extractLayoutText(buffer);
    if (layout.trim() !== "") return layout;
  }
  return extractPdfText(buffer).text;
}

