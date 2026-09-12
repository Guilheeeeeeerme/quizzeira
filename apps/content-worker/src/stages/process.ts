// Concept: Role-aware process pass — normalize → classify → route (§9–10).
import {
  chunkSections,
  decideEligibility,
  isGenerationEligibleSection,
  roleAllows,
  type DocumentRole,
} from "@quizzeira/shared";
import { logInfo, logWarn } from "@quizzeira/worker-kit";
import { content } from "../clients.js";
import { contentEnv } from "../env.js";
import { extractMcqs } from "../extraction/mcq.js";
import {
  extractOabDocument,
  isOabExamSlug,
  type OabDocumentRef,
  type OabExtractionDeps,
} from "../extraction/oab/index.js";
import { classifyNormalized } from "./classify.js";
import { importDiscoveryArtifacts } from "./import.js";
import { normalizeDocument } from "./normalize.js";
import { parseSyllabusFromSections } from "./syllabus/parse.js";

const NAME = "content-worker/process";

interface QueuedDocument {
  id: string;
  examSlug: string;
  examTitle?: string | null;
  kind: string;
  role?: string;
  sourceUrl: string | null;
  storageKey: string | null;
  contentType: string | null;
  attempts: number;
}

export interface ProcessPassResult {
  imported: number;
  processed: number;
  failed: number;
  chunks: number;
  drafted: number;
  syllabi: number;
}

export async function runProcessPass(): Promise<ProcessPassResult> {
  const result: ProcessPassResult = {
    imported: 0,
    processed: 0,
    failed: 0,
    chunks: 0,
    drafted: 0,
    syllabi: 0,
  };

  result.imported = await importDiscoveryArtifacts();

  const { items } = await content.get<{ items: QueuedDocument[] }>(
    `/internal/extraction/queue?limit=${contentEnv.docsPerPass}`,
  );

  for (const document of items) {
    try {
      await content.patch(`/internal/documents/${document.id}`, {
        status: "normalizing",
        bumpAttempts: true,
      });

      const normalized = await normalizeDocument(document);
      if (!normalized) {
        // Legacy PDF path for OAB / when doc-processor is down.
        if (isOabExamSlug(document.examSlug) || /pdf/i.test(document.contentType ?? "")) {
          await legacyExtract(document, result);
          continue;
        }
        await content.patch(`/internal/documents/${document.id}`, {
          status: "failed",
          failReason: "normalize_failed",
        });
        result.failed += 1;
        continue;
      }

      await content.post(`/internal/documents/${document.id}/normalized`, {
        normalized,
      });

      await content.patch(`/internal/documents/${document.id}`, { status: "classifying" });
      const classified = classifyNormalized(normalized, {
        kind: document.kind,
        roleHint: document.role,
      });

      await content.post(`/internal/documents/${document.id}/classification`, {
        role: classified.role,
        roleConfidence: classified.roleConfidence,
        roleMethod: classified.roleMethod,
        subtype: classified.subtype,
        sections: classified.sections.map((s) => ({
          ordinal: s.ordinal,
          path: s.path,
          heading: s.heading,
          level: s.level,
          role: s.role,
          scores: s.scores,
          charCount: s.charCount,
        })),
      });

      const role = classified.role as DocumentRole;

      if (roleAllows("syllabus_extraction", role)) {
        const parsed = parseSyllabusFromSections(
          classified.sections.map((s) => ({
            id: `${document.id}:${s.ordinal}`,
            heading: s.heading,
            text: s.text,
            role: s.role,
          })),
          { title: document.examTitle },
        );
        await content.post("/internal/syllabus", {
          examSlug: document.examSlug,
          sourceDocumentId: document.id,
          sourceDocumentHash: normalized.contentHash,
          status: parsed.status,
          positions: parsed.positions,
          nodes: parsed.nodes,
        });
        result.syllabi += 1;
      }

      if (roleAllows("previous_question_parse", role) || /prova|gabarito/i.test(document.kind)) {
        const text = classified.sections.map((s) => s.text).join("\n\n");
        const mcqs = extractMcqs(text);
        if (mcqs.length) {
          await content.post(`/internal/documents/${document.id}/previous-questions`, {
            items: mcqs,
            examFamily: document.examSlug.split("-")[0] ?? document.examSlug,
          });
          result.drafted += mcqs.length;
        }
      }

      if (roleAllows("knowledge_index", role)) {
        const eligibleSections = classified.sections
          .filter((s) => isGenerationEligibleSection(s.role as never))
          .map((s) => ({
            id: `${document.id}:${s.ordinal}`,
            ordinal: s.ordinal,
            path: s.path,
            heading: s.heading,
            level: s.level,
            text: s.text,
            charCount: s.charCount,
            blockRange: [0, 0] as [number, number],
            flags: [] as Array<"boilerplate" | "garbage" | "non_pt" | "table_only" | "legal_article">,
          }));
        const chunks = chunkSections(eligibleSections, {
          targetChars: contentEnv.chunkTargetChars,
          maxChunks: contentEnv.maxChunksPerDocument,
        });
        const withEligibility = chunks.map((c) => {
          const gate =   decideEligibility({
            sectionRole: "content",
            documentRole: "knowledge",
            language: "pt",
            charCount: c.charCount,
            scores: {
              contentDensity: 0.7,
              educationalSignal: 0.7,
              metadataProbability: 0.1,
              testability: 0.7,
              noise: 0.1,
              sectionQuality: 0.7,
            },
            mappedScore: 0.7,
          });
          return {
            ordinal: c.ordinal,
            text: c.text,
            tokenCount: c.tokenCount,
            contentHash: c.contentHash,
            sectionOrdinal: c.sectionOrdinal,
            eligibility: gate.status,
            eligibilityReason: gate.reason,
          };
        });
        const posted = await content.post<{ chunkCount: number }>(
          `/internal/documents/${document.id}/chunks`,
          { chunks: withEligibility },
        );
        result.chunks += posted.chunkCount;
      }

      await content.patch(`/internal/documents/${document.id}`, { status: "extracted" });
      result.processed += 1;
    } catch (err) {
      result.failed += 1;
      logWarn("process failed", {
        worker: NAME,
        id: document.id,
        error: err instanceof Error ? err.message : String(err),
      });
      await content
        .patch(`/internal/documents/${document.id}`, {
          status: "failed",
          failReason: (err instanceof Error ? err.message : String(err)).slice(0, 200),
        })
        .catch(() => undefined);
    }
  }

  if (result.processed || result.imported) logInfo("process pass", { worker: NAME, ...result });
  return result;
}

async function legacyExtract(document: QueuedDocument, result: ProcessPassResult): Promise<void> {
  if (!isOabExamSlug(document.examSlug)) {
    await content.patch(`/internal/documents/${document.id}`, {
      status: "failed",
      failReason: "doc_processor_required_for_pdf",
    });
    result.failed += 1;
    return;
  }
  const { base64 } = await content.get<{ base64: string }>(`/internal/documents/${document.id}/bytes`);
  const buffer = Buffer.from(base64, "base64");
  const deps: OabExtractionDeps = {
    async listDocuments(examSlug, kind) {
      const { items } = await content.get<{ items: OabDocumentRef[] }>(
        `/internal/documents?examSlug=${encodeURIComponent(examSlug)}&kind=${kind}`,
      );
      return items;
    },
    async documentBytes(documentId) {
      const bytes = await content.get<{ base64: string }>(`/internal/documents/${documentId}/bytes`);
      return Buffer.from(bytes.base64, "base64");
    },
    async draft({ examSlug, documentId, group }) {
      const { created } = await content.post<{ created: number }>("/internal/question-items/draft", {
        examSlug,
        subject: group.subject,
        locale: "pt",
        origin: "extraction",
        documentId,
        questions: group.questions,
      });
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
  const { drafted } = await extractOabDocument(ref, buffer, deps);
  result.drafted += drafted;
  await content.patch(`/internal/documents/${document.id}`, { status: "extracted" });
  result.processed += 1;
}
