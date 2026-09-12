// Concept: Previous-exam processing (§18).

import { createHash } from "node:crypto";
import { content } from "../../clients.js";
import { extractMcqs } from "../../extraction/mcq.js";
import type { ClassifiedSection } from "../classify.js";
import { mapChunksLexical, type SyllabusLeafRef } from "../knowledge/mapping.js";
import { findMatchingGabarito, type EvidenceDocumentRef } from "./pairing.js";
import { buildStyleProfile } from "./style-profile.js";

export interface EvidenceProcessResult {
  previousQuestions: number;
  styleProfiles: number;
}

interface QueuedDocument {
  id: string;
  examSlug: string;
  kind: string;
  sourceUrl: string | null;
}

function yearFromUrlOrText(url: string | null, text: string): number | null {
  const fromUrl = url?.match(/(20\d{2})/);
  if (fromUrl) return Number(fromUrl[1]);
  const fromText = text.match(/\b(20\d{2})\b/);
  return fromText ? Number(fromText[1]) : null;
}

function bancaFromSlug(examSlug: string): string | null {
  const first = examSlug.split(/[-_/]/)[0]?.trim();
  return first && first.length >= 2 ? first : null;
}

export async function processEvidenceDocument(
  document: QueuedDocument,
  text: string,
  sections: ClassifiedSection[],
): Promise<EvidenceProcessResult> {
  let extraKeyText = "";
  if (document.kind === "prova") {
    const { items } = await content.get<{ items: EvidenceDocumentRef[] }>(
      `/internal/documents?examSlug=${encodeURIComponent(document.examSlug)}&kind=gabarito`,
    );
    const gabarito = findMatchingGabarito(document, items, text);
    if (gabarito) {
      const bytes = await content.get<{ base64: string }>(
        `/internal/documents/${gabarito.id}/bytes`,
      );
      // Keep prova body separate so splitAnswerKeySection + parseAnswerKey see a
      // real key document (§18.2 ANULADA / passage stay on the prova side).
      extraKeyText = Buffer.from(bytes.base64, "base64").toString("utf8");
    }
  }

  const questions = extractMcqs(text, extraKeyText);
  if (questions.length === 0) return { previousQuestions: 0, styleProfiles: 0 };

  let leaves: SyllabusLeafRef[] = [];
  try {
    const res = await content.get<{ leaves: SyllabusLeafRef[] }>(
      `/internal/syllabi/${encodeURIComponent(document.examSlug)}/leaves`,
    );
    leaves = res.leaves ?? [];
  } catch {
    leaves = [];
  }

  const year = yearFromUrlOrText(document.sourceUrl, `${text}\n${extraKeyText}`);
  const banca = bancaFromSlug(document.examSlug);

  const payload = questions.map((q) => {
    const mapText = `${q.prompt}\n${q.options.join("\n")}`;
    const maps =
      leaves.length > 0
        ? mapChunksLexical(
            [
              {
                ordinal: 0,
                sectionId: "evidence",
                sectionRole: "question_block",
                text: mapText,
                tokenCount: Math.ceil(mapText.length / 4),
                contentHash: "evidence",
              },
            ],
            leaves,
          )
        : [];
    const best = maps.sort((a, b) => b.score - a.score)[0];
    const mapped = best && best.score >= 0.5 ? best : null;

    return {
      fingerprint: createHash("sha256")
        .update(`${document.examSlug}|${document.id}|${q.number}|${q.prompt.slice(0, 120)}`)
        .digest("hex")
        .slice(0, 32),
      documentId: document.id,
      examFamily: document.examSlug,
      banca,
      year,
      position: mapped ? leaves.find((l) => l.id === mapped.syllabusNodeId)?.title ?? null : null,
      phase: "objective",
      number: q.number,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
      status: q.status,
      passage: q.passage,
      subjectHint: mapped?.canonicalKey ?? null,
      syllabusNodeId: mapped?.syllabusNodeId ?? null,
      canonicalKey: mapped?.canonicalKey ?? null,
      mapScore: mapped?.score ?? null,
    };
  });

  const posted = await content.post<{ created: number }>("/internal/previous-questions", {
    items: payload,
  });

  let styleProfiles = 0;
  const scored = questions.filter((q) => q.status === "ok");
  if (posted.created >= 5 && scored.length >= 5) {
    const canonicalSubjectId =
      payload.find((p) => p.canonicalKey)?.canonicalKey?.split(":")[0] ?? "geral";
    const profile = buildStyleProfile(
      scored.map((q) => ({
        prompt: q.prompt,
        options: q.options,
        passage: q.passage,
        banca,
        canonicalSubjectId,
      })),
      banca ?? "unknown",
      canonicalSubjectId,
    );
    await content.post("/internal/style-profiles", profile);
    styleProfiles = 1;
  }

  return { previousQuestions: posted.created, styleProfiles };
}
