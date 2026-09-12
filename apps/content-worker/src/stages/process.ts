// Concept: V2 document processing orchestrator (normalize → classify → branch).

import { createHash } from "node:crypto";
import { logInfo, logWarn } from "@quizzeira/worker-kit";
import type { DocumentRole } from "@quizzeira/shared";
import {
  isGenerationEligibleRole,
  isSyllabusSourceRole,
  OAB_STATIC_SYLLABUS,
} from "@quizzeira/shared";
import { content, discovery } from "../clients.js";
import { contentEnv } from "../env.js";
import {
  extractLayoutText,
  extractOabDocument,
  isOabExamSlug,
  type OabDocumentRef,
  type OabExtractionDeps,
} from "../extraction/oab/index.js";
import { extractHtmlText } from "./html-text.js";
import { classifyDocument } from "./classify.js";
import { classifyRoleCentroid } from "./classify-centroid.js";
import { classifyRoleLlmResidue } from "./classify-llm.js";
import { processEvidenceDocument } from "./evidence/index.js";
import { hasEmbeddingProvider, embedText } from "../embeddings/index.js";
import { chunkSections } from "./knowledge/chunker.js";
import { dedupeChunks } from "./knowledge/dedup.js";
import { distillKnowledgeUnits } from "./knowledge/distill.js";
import { decideEligibility } from "./knowledge/eligibility.js";
import {
  leafEmbeddingText,
  mapChunksEmbedding,
  mapChunksLexical,
  mergeMapResults,
  type SyllabusLeafRef,
} from "./knowledge/mapping.js";
import { mapChunksLlmResidue } from "./knowledge/mapping-llm.js";
import { normalizeDocument, normalizeHtmlFallback } from "./normalize.js";
import {
  bonusesFromDomainStats,
  computePageRank,
  domainAuthority,
  freshnessOrStability,
  structureScoreFromText,
} from "./rank.js";
import { parseSyllabusFromDocument, postSyllabus } from "./syllabus/parse.js";
import { discoverPositions } from "./syllabus/positions.js";
import { structureSyllabusResidue } from "./syllabus/residue-llm.js";
import { computeRetificacaoDelta } from "./syllabus/retificacao.js";
import { emitStageMetric } from "../stage-metrics.js";

const NAME = "content-worker/process";

interface QueuedDocument {
  id: string;
  examSlug: string;
  examTitle: string | null;
  kind: string;
  role?: DocumentRole;
  sourceUrl: string | null;
  storageKey: string | null;
  contentType: string | null;
  attempts: number;
}

export interface ProcessPassResult {
  processed: number;
  failed: number;
  chunks: number;
  syllabi: number;
  evidence: number;
}

const PAST_EXAM_KINDS = new Set(["prova", "gabarito", "past_exam"]);

export async function runProcessPass(): Promise<ProcessPassResult> {
  const result: ProcessPassResult = {
    processed: 0,
    failed: 0,
    chunks: 0,
    syllabi: 0,
    evidence: 0,
  };

  const { items } = await content.get<{ items: QueuedDocument[] }>(
    `/internal/extraction/queue?limit=${contentEnv.docsPerPass}`,
  );

  for (const document of items) {
    try {
      await content.patch(`/internal/documents/${document.id}`, {
        status: "extracting",
        bumpAttempts: true,
      });

      if (isOabExamSlug(document.examSlug)) {
        await processOabLegacy(document);
        result.processed += 1;
        continue;
      }

      const { buffer, contentType } = await documentBytes(document);
      const normalizeInput = {
        documentId: document.id,
        contentType: contentType || document.contentType || "application/octet-stream",
        bytes: buffer,
        url: document.sourceUrl,
      };
      const normalized = contentEnv.stageNormalizeEnabled
        ? await normalizeDocument(normalizeInput)
        : normalizeHtmlFallback(normalizeInput);

      let classification = classifyDocument(normalized, {
        roleHint: (document.role as never) ?? null,
        kindHint: null,
      });
      if (!contentEnv.stageClassifyEnabled) {
        classification = {
          ...classification,
          role: (document.role as DocumentRole) || classification.role,
          roleConfidence: 0,
          roleMethod: "disabled",
        };
      } else {
        if (hasEmbeddingProvider()) {
          const centroid = await classifyRoleCentroid(normalized, classification, embedText);
          if (centroid) classification = centroid;
        }
        const llmClassified = await classifyRoleLlmResidue(normalized, classification);
        if (llmClassified) classification = llmClassified;
      }
      const sectionsPayload = classification.sections.map(({ section, role, scores }) => ({
        ordinal: section.ordinal,
        path: section.path,
        heading: section.heading,
        level: section.level,
        role,
        scores,
        charCount: section.charCount,
        pageRange: section.pageRange ?? null,
        sourceSectionId: section.id,
      }));

      await content.patch(`/internal/documents/${document.id}`, {
        role: classification.role,
        roleConfidence: classification.roleConfidence,
        roleMethod: classification.roleMethod,
        subtype: classification.subtype,
        contentHash: normalized.contentHash,
        language: normalized.stats.language,
        normalizerVersion: normalized.extractor.version,
        stats: normalized.stats,
      });
      await content
        .put(`/internal/documents/${document.id}/normalized`, { document: normalized })
        .catch(() => undefined);

      if (classification.role === "administrative") {
        await content.post(`/internal/documents/${document.id}/pipeline-output`, {
          sections: sectionsPayload,
          chunks: [],
        });
        await emitStageMetric({
          stage: "classify",
          decision: "administrative",
          reason: classification.roleMethod,
        });
        if (document.sourceUrl) {
          try {
            const host = new URL(document.sourceUrl).hostname.replace(/^www\./, "");
            await discovery
              .post(`/internal/domain-stats/${encodeURIComponent(host)}/observe`, {
                rejectedLowValue: 1,
              })
              .catch(() => undefined);
          } catch {
            /* ignore bad URLs */
          }
        }
        result.processed += 1;
        continue;
      }

      let chunkDrafts = isGenerationEligibleRole(classification.role)
        ? chunkSections(classification.sections, { maxChars: contentEnv.chunkTargetChars })
        : [];

      const deduped = dedupeChunks(chunkDrafts);

      // Load active syllabus leaves so lexical mapping can un-park chunks.
      let leaves: SyllabusLeafRef[] = [];
      if (contentEnv.stageKnowledgeEnabled && isGenerationEligibleRole(classification.role)) {
        try {
          const res = await content.get<{ leaves: SyllabusLeafRef[] }>(
            `/internal/syllabi/${encodeURIComponent(document.examSlug)}/leaves`,
          );
          leaves = res.leaves ?? [];
        } catch {
          leaves = [];
        }
      }

      const mapResults = leaves.length > 0 ? mapChunksLexical(deduped.chunks, leaves) : [];
      let embMaps: typeof mapResults = [];
      if (leaves.length > 0 && hasEmbeddingProvider() && deduped.chunks.length > 0) {
        try {
          const { items: leafEmbs } = await content.post<{
            items: Array<{ id: string; embedding: number[] }>;
          }>("/internal/syllabus-nodes/embeddings", {
            ids: leaves.map((l) => l.id),
          });
          const embById = new Map(leafEmbs.map((row) => [row.id, row.embedding]));
          const leavesWithEmb: SyllabusLeafRef[] = [];
          for (const leaf of leaves) {
            let embedding = embById.get(leaf.id) ?? null;
            if (!embedding) {
              embedding = await embedText(leafEmbeddingText(leaf));
              await content
                .put(`/internal/syllabus-nodes/${leaf.id}/embedding`, { embedding })
                .catch(() => undefined);
            }
            leavesWithEmb.push({ ...leaf, embedding });
          }
          const chunkEmbeddings = new Map<number, number[]>();
          for (const chunk of deduped.chunks.slice(0, 24)) {
            chunkEmbeddings.set(chunk.ordinal, await embedText(chunk.text.slice(0, 4000)));
          }
          embMaps = mapChunksEmbedding(deduped.chunks, leavesWithEmb, chunkEmbeddings);
        } catch (err) {
          logWarn("mapping tier2 skipped", {
            worker: NAME,
            documentId: document.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      const llmMaps =
        leaves.length > 0
          ? await mapChunksLlmResidue(
              deduped.chunks,
              leaves,
              mergeMapResults(mapResults, embMaps),
            )
          : [];
      const allMaps = mergeMapResults(mapResults, embMaps, llmMaps);
      const bestMapByOrdinal = new Map<number, number>();
      for (const m of allMaps) {
        const prev = bestMapByOrdinal.get(m.chunkOrdinal) ?? 0;
        if (m.score > prev) bestMapByOrdinal.set(m.chunkOrdinal, m.score);
      }

      const avgDensity =
        classification.sections.reduce((s, sec) => s + sec.scores.contentDensity, 0) /
        Math.max(classification.sections.length, 1);
      const maxMap =
        [...bestMapByOrdinal.values()].reduce((a, b) => Math.max(a, b), 0) || 0;
      const host = (() => {
        try {
          return document.sourceUrl
            ? new URL(document.sourceUrl).hostname.replace(/^www\./, "")
            : null;
        } catch {
          return null;
        }
      })();
      let historyBonus = 0;
      let spamPenalty = 0;
      let sourceKind: string | null = null;
      let sourceAuthority: number | null = null;
      if (host) {
        const [{ stats }, sourcesResp] = await Promise.all([
          discovery
            .get<{
              stats: {
                fetched: number;
                becameKnowledge: number;
                rejectedLowValue: number;
                avgDensity: number | null;
              } | null;
            }>(`/internal/domain-stats/${encodeURIComponent(host)}`)
            .catch(() => ({ stats: null })),
          discovery
            .get<{
              items: Array<{
                domain: string;
                kind: string;
                authorityScore: number | null;
              }>;
            }>("/internal/sources?status=active")
            .catch(() => ({ items: [] as Array<{ domain: string; kind: string; authorityScore: number | null }> })),
        ]);
        if (stats) {
          const bonuses = bonusesFromDomainStats(stats);
          historyBonus = bonuses.historyBonus;
          spamPenalty = bonuses.spamPenalty;
        }
        const matched = sourcesResp.items.find(
          (s) =>
            host === s.domain ||
            host.endsWith(`.${s.domain}`) ||
            s.domain.endsWith(`.${host}`) ||
            host.includes(s.domain),
        );
        if (matched) {
          sourceKind = matched.kind;
          sourceAuthority =
            matched.authorityScore != null && Number.isFinite(matched.authorityScore)
              ? matched.authorityScore
              : null;
        }
      }
      const pageRank = computePageRank({
        authority: domainAuthority({
          domain: host,
          kind:
            sourceKind ??
            (classification.role === "knowledge"
              ? "educational_site"
              : classification.role === "specification"
                ? "banca_portal"
                : "unknown"),
          authorityScore: sourceAuthority,
          historyBonus,
          spamPenalty,
        }),
        contentDensity: avgDensity,
        syllabusRelevance: maxMap,
        structureScore: structureScoreFromText(
          classification.sections.map((s) => s.section.text).join("\n"),
        ),
        freshnessOrStability: freshnessOrStability(classification.role),
      });
      await content
        .patch(`/internal/documents/${document.id}`, { rank: pageRank })
        .catch(() => undefined);

      const chunksWithEligibility = deduped.chunks.map((chunk) => {
        const section = classification.sections.find((s) => s.section.id === chunk.sectionId);
        const scores = section?.scores ?? classification.sections[0]?.scores;
        const decision = decideEligibility({
          documentRole: classification.role,
          sectionRole: chunk.sectionRole,
          language: normalized.stats.language,
          chunk,
          scores: scores ?? {
            contentDensity: 0,
            metadataProbability: 1,
            educationalSignal: 0,
            testability: 0,
            noise: 0,
            sectionQuality: 0,
          },
          isDuplicate: chunk.duplicateOfOrdinal != null,
          mapScore: bestMapByOrdinal.get(chunk.ordinal) ?? null,
        });
        return {
          ordinal: chunk.ordinal,
          sectionOrdinal: section?.section.ordinal ?? 0,
          text: chunk.text,
          tokenCount: chunk.tokenCount,
          contentHash: chunk.contentHash,
          eligibility: decision.status,
          eligibilityReason: decision.reason,
          duplicateOfOrdinal: chunk.duplicateOfOrdinal,
        };
      });

      await content.post(`/internal/documents/${document.id}/pipeline-output`, {
        sections: sectionsPayload,
        chunks: chunksWithEligibility,
      });
      result.chunks += chunksWithEligibility.length;

      if (allMaps.length > 0) {
        await content
          .post("/internal/chunk-maps", {
            maps: allMaps.map((m) => ({
              documentId: document.id,
              chunkOrdinal: m.chunkOrdinal,
              syllabusNodeId: m.syllabusNodeId,
              canonicalKey: m.canonicalKey,
              score: m.score,
              method: m.method,
            })),
          })
          .catch((err) => {
            logWarn("chunk-maps persist failed", {
              worker: NAME,
              documentId: document.id,
              error: err instanceof Error ? err.message : String(err),
            });
          });
      }

      if (contentEnv.stageSyllabusEnabled && isSyllabusSourceRole(classification.role)) {
        const positions = discoverPositions(normalized, classification.sections);
        const parsed = parseSyllabusFromDocument(normalized, classification.sections, positions);

        // LLM residue: if outline parse is thin, structure leftover syllabus prose.
        if (parsed.status === "needs_review" || parsed.nodes.filter((n) => n.depth >= 1).length < 10) {
          const syllabusText = classification.sections
            .filter((s) => s.role === "syllabus" || /program[áa]tico/i.test(s.section.heading ?? ""))
            .map((s) => s.section.text)
            .join("\n");
          if (syllabusText.length > 80) {
            const residueSubject =
              classification.sections.find((s) => s.role === "syllabus")?.section.heading?.trim() ||
              document.examTitle?.trim() ||
              document.examSlug;
            const residue = await structureSyllabusResidue(residueSubject, syllabusText);
            const residuePositionSlugs =
              positions.map((p) => p.slug).filter(Boolean).slice(0, 8);
            const positionSlugs =
              residuePositionSlugs.length > 0 ? residuePositionSlugs : ["implicit"];
            let ordinal = parsed.nodes.length;
            for (const topic of residue.topics) {
              const subjectPath = topic.title;
              parsed.nodes.push({
                depth: 0,
                ordinal: ordinal++,
                title: topic.title,
                rawText: topic.title,
                pathSlug: subjectPath.toLowerCase().replace(/\s+/g, "-"),
                canonicalSubjectId: null,
                canonicalKey: subjectPath.toLowerCase().replace(/\s+/g, "-"),
                scope: "basic",
                positionSlugs,
                parentPathSlug: null,
                extraction: {
                  method: "llm_structured",
                  confidence: 0.65,
                  sourceSectionId: classification.sections[0]?.section.id ?? "residue",
                },
              });
              for (const sub of topic.subtopics) {
                parsed.nodes.push({
                  depth: 1,
                  ordinal: ordinal++,
                  title: sub,
                  rawText: sub,
                  pathSlug: `${subjectPath}/${sub}`.toLowerCase().replace(/\s+/g, "-"),
                  canonicalSubjectId: null,
                  canonicalKey: `${subjectPath}/${sub}`.toLowerCase().replace(/\s+/g, "-"),
                  scope: "basic",
                  positionSlugs,
                  parentPathSlug: subjectPath.toLowerCase().replace(/\s+/g, "-"),
                  extraction: {
                    method: "llm_structured",
                    confidence: 0.6,
                    sourceSectionId: classification.sections[0]?.section.id ?? "residue",
                  },
                });
              }
            }
            if (parsed.nodes.filter((n) => n.depth >= 1).length >= 10) {
              parsed.status = "active";
            }
          }
        }

        if (parsed.nodes.length > 0) {
          let toPost = parsed;
          if (
            classification.subtype === "edital_retificacao" ||
            /\bretifica[çc][ãa]o\b/i.test(normalized.metadata?.title ?? "")
          ) {
            try {
              const { leaves: prevLeaves } = await content.get<{
                leaves: Array<{
                  id: string;
                  title: string;
                  pathSlug: string;
                  canonicalKey: string;
                  depth: number;
                }>;
              }>(`/internal/syllabi/${encodeURIComponent(document.examSlug)}/leaves`);
              if (prevLeaves.length > 0) {
                const delta = computeRetificacaoDelta(
                  prevLeaves.map((l) => ({
                    canonicalKey: l.canonicalKey,
                    title: l.title,
                    depth: l.depth,
                    pathSlug: l.pathSlug,
                  })),
                  parsed.nodes,
                );
                toPost = {
                  ...parsed,
                  nodes: delta.mergedNodes.length > 0 ? delta.mergedNodes : parsed.nodes,
                };
                logInfo("retificação delta applied", {
                  worker: NAME,
                  examSlug: document.examSlug,
                  replaced: delta.replacedNodeKeys.length,
                  newLeaves: delta.newNodes.length,
                });
              }
            } catch (err) {
              logWarn("retificação merge skipped", {
                worker: NAME,
                examSlug: document.examSlug,
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }

          await postSyllabus(content, {
            examSlug: document.examSlug,
            documentId: document.id,
            contentHash: normalized.contentHash,
            parsed: toPost,
          });
          result.syllabi += 1;
        }
      }

      // Distill KUs from eligible mapped chunks (requires LLM provider).
      if (
        contentEnv.stageKnowledgeEnabled &&
        isGenerationEligibleRole(classification.role) &&
        leaves.length > 0
      ) {
        const eligibleOrdinals = new Set(
          chunksWithEligibility
            .filter((c) => c.eligibility === "eligible")
            .map((c) => c.ordinal),
        );
        const byLeaf = new Map<string, typeof deduped.chunks>();
        for (const m of allMaps) {
          if (!eligibleOrdinals.has(m.chunkOrdinal) || m.score < 0.62) continue;
          const chunk = deduped.chunks.find((c) => c.ordinal === m.chunkOrdinal);
          if (!chunk) continue;
          const list = byLeaf.get(m.syllabusNodeId) ?? [];
          list.push(chunk);
          byLeaf.set(m.syllabusNodeId, list);
        }

        const allUnits: Array<Record<string, unknown>> = [];
        for (const leaf of leaves) {
          const leafChunks = byLeaf.get(leaf.id)?.slice(0, 4) ?? [];
          if (leafChunks.length === 0) continue;
          const units = await distillKnowledgeUnits(leafChunks, {
            id: leaf.id,
            canonicalKey: leaf.canonicalKey,
            path: [leaf.parentTitle, leaf.title].filter(Boolean) as string[],
          });
          for (const u of units) {
            allUnits.push({
              ...u,
              evidence: u.evidence.map((e) => ({
                ...e,
                documentId: document.id,
                sourceUrl: document.sourceUrl,
              })),
            });
          }
        }
        if (allUnits.length > 0) {
          await content
            .post("/internal/knowledge-units", {
              documentId: document.id,
              units: allUnits,
            })
            .catch(() => undefined);
        }
      }

      if (
        contentEnv.stageEvidenceEnabled &&
        (classification.role === "evidence" || PAST_EXAM_KINDS.has(document.kind))
      ) {
        const text = normalized.sections.map((s) => s.text).join("\n\n");
        const ev = await processEvidenceDocument(document, text, classification.sections);
        result.evidence += ev.previousQuestions;
      }

      if (
        (classification.role === "knowledge" || classification.role === "mixed") &&
        document.sourceUrl
      ) {
        try {
          const host = new URL(document.sourceUrl).hostname.replace(/^www\./, "");
          await discovery
            .post(`/internal/domain-stats/${encodeURIComponent(host)}/observe`, {
              becameKnowledge: 1,
              avgDensity,
            })
            .catch(() => undefined);
        } catch {
          /* ignore */
        }
      }

      result.processed += 1;
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      logWarn("process failed", { worker: NAME, documentId: document.id, error: message });
      await content
        .patch(`/internal/documents/${document.id}`, {
          status: "failed",
          failReason: message.slice(0, 400),
        })
        .catch(() => undefined);
    }
  }

  if (result.processed || result.failed) {
    logInfo("process pass", { worker: NAME, ...result });
  }
  return result;
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

async function processOabLegacy(document: QueuedDocument): Promise<void> {
  const { buffer, contentType } = await documentBytes(document);
  const text = bytesToText(buffer, contentType, document.examSlug);
  const chunks = text
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 40)
    .slice(0, contentEnv.maxChunksPerDocument)
    .map((t, ordinal) => ({
      ordinal,
      sectionOrdinal: 0,
      text: t,
      tokenCount: Math.ceil(t.length / 4),
      contentHash: undefined,
      eligibility: "parked" as const,
      eligibilityReason: "oab_legacy",
    }));

  await content.post(`/internal/documents/${document.id}/chunks`, {
    chunks: chunks.map((c) => ({ text: c.text, tokenCount: c.tokenCount })),
  });

  const leafBySlug = await ensureOabStaticSyllabus(document);

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
      const syllabusNodeId = leafBySlug.get(group.subjectSlug) ?? null;
      const pqItems = group.questions.map((q, i) => ({
        fingerprint: createHash("sha256")
          .update(`${examSlug}|${documentId}|${group.subjectSlug}|${i}|${q.prompt.slice(0, 120)}`)
          .digest("hex")
          .slice(0, 32),
        documentId,
        examFamily: examSlug,
        banca: "FGV",
        phase: "objective",
        number: i + 1,
        prompt: q.prompt,
        options: q.options ?? [],
        correctIndex: q.correctIndex,
        subjectHint: group.subjectSlug,
        syllabusNodeId,
        canonicalKey: group.subjectSlug,
      }));
      const posted = await content.post<{ created: number; ids: string[] }>(
        "/internal/previous-questions",
        { items: pqItems },
      );
      const questions = group.questions.map((q, i) => ({
        ...q,
        syllabusNodeId,
        previousQuestionId: posted.ids[i] ?? null,
      }));
      const { created } = await content.post<{ created: number }>(
        "/internal/question-items/draft",
        {
          examSlug,
          subject: group.subject,
          locale: "pt",
          origin: "transcription",
          documentId,
          syllabusNodeId,
          questions,
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
  await extractOabDocument(ref, buffer, deps);
}

/** Upsert OAB_STATIC_SYLLABUS leaves and return slug → nodeId (§47 / §30). */
async function ensureOabStaticSyllabus(
  document: QueuedDocument,
): Promise<Map<string, string>> {
  const leafBySlug = new Map<string, string>();
  try {
    const { leaves } = await content.get<{
      leaves: Array<{ id: string; pathSlug: string; title: string }>;
    }>(`/internal/syllabi/${encodeURIComponent(document.examSlug)}/leaves`);
    for (const leaf of leaves ?? []) {
      const slug = leaf.pathSlug.split("/").pop() ?? leaf.pathSlug;
      leafBySlug.set(slug, leaf.id);
    }
    if (leafBySlug.size >= OAB_STATIC_SYLLABUS.length * 0.5) return leafBySlug;
  } catch {
    /* create below */
  }

  const nodes = OAB_STATIC_SYLLABUS.map((s, ordinal) => ({
    depth: 0,
    ordinal,
    title: s.subject,
    rawText: s.subject,
    pathSlug: s.pathSlug,
    canonicalSubjectId: null,
    canonicalKey: s.pathSlug,
    scope: "specific",
    positionSlugs: ["geral"],
    parentPathSlug: null,
    extraction: { method: "manual", confidence: 1, sourceSectionId: "oab-static" },
  }));

  await content
    .post("/internal/syllabi", {
      examSlug: document.examSlug,
      sourceDocumentId: document.id,
      sourceDocumentHash: document.id,
      status: "active",
      positions: [{ title: "Geral", slug: "geral", implicit: true }],
      nodes,
    })
    .catch((err) => {
      logWarn("oab static syllabus upsert failed", {
        examSlug: document.examSlug,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  try {
    const { leaves } = await content.get<{
      leaves: Array<{ id: string; pathSlug: string }>;
    }>(`/internal/syllabi/${encodeURIComponent(document.examSlug)}/leaves`);
    for (const leaf of leaves ?? []) {
      const slug = leaf.pathSlug.split("/").pop() ?? leaf.pathSlug;
      leafBySlug.set(slug, leaf.id);
    }
  } catch {
    /* leave map empty — drafts still proceed */
  }
  return leafBySlug;
}

function bytesToText(buffer: Buffer, contentType: string, examSlug: string): string {
  if (/html/i.test(contentType)) return extractHtmlText(buffer.toString("utf8"));
  const isPdf = buffer.subarray(0, 5).toString("latin1").startsWith("%PDF");
  if (!isPdf && !/pdf/i.test(contentType)) return buffer.toString("utf8");
  // OAB keeps geometry-based PDF reading; no hand-rolled content-stream reader.
  if (isOabExamSlug(examSlug)) {
    return extractLayoutText(buffer);
  }
  return buffer.toString("utf8");
}
