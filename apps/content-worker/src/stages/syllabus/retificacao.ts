// Concept: Syllabus delta from retificação documents (§15.6).

import { tokenSetRatio } from "@quizzeira/shared";
import type { SyllabusNodeDraft } from "./parse.js";

export interface PreviousSyllabusNode {
  canonicalKey: string;
  title: string;
  rawText?: string;
  depth: number;
  pathSlug?: string;
}

export interface SyllabusDelta {
  replacedNodeKeys: string[];
  retiredNodeKeys: string[];
  newNodes: Array<{ canonicalKey: string; title: string; rawText: string }>;
  /** Merged node list for the next syllabus version (previous − replaced + retificação nodes). */
  mergedNodes: SyllabusNodeDraft[];
}

const FUZZY_REPLACE_THRESHOLD = 85;

function subjectKey(node: { canonicalKey: string; title: string; pathSlug?: string }): string {
  const path = (node.pathSlug ?? node.canonicalKey ?? node.title).toLowerCase();
  const parts = path.split(/[/\-▸>]/).map((p) => p.trim()).filter(Boolean);
  return parts[0] ?? node.title.toLowerCase();
}

/**
 * Build a syllabus delta: retificação leaf items replace previous leaves under
 * the same subject when token-set ratio ≥ 85; unmatched retificação leaves are
 * appended; previous leaves that were replaced are listed in replacedNodeKeys.
 */
export function computeRetificacaoDelta(
  previous: PreviousSyllabusNode[],
  retificacaoNodes: SyllabusNodeDraft[],
): SyllabusDelta {
  const prevLeaves = previous.filter((n) => n.depth >= 1);
  const retiLeaves = retificacaoNodes.filter((n) => n.depth >= 1);
  const retiSubjects = retificacaoNodes.filter((n) => n.depth === 0);

  const replacedNodeKeys: string[] = [];
  const consumedPrev = new Set<string>();
  const newNodes: SyllabusDelta["newNodes"] = [];

  for (const reti of retiLeaves) {
    const subj = subjectKey(reti);
    let best: { key: string; score: number } | null = null;
    for (const prev of prevLeaves) {
      if (consumedPrev.has(prev.canonicalKey)) continue;
      if (subjectKey(prev) !== subj && !subj.includes(subjectKey(prev)) && !subjectKey(prev).includes(subj)) {
        // Allow match when titles share subject tokens loosely
        const subjScore = tokenSetRatio(subj, subjectKey(prev));
        if (subjScore < 70) continue;
      }
      const score = tokenSetRatio(reti.title, prev.title);
      if (score >= FUZZY_REPLACE_THRESHOLD && (!best || score > best.score)) {
        best = { key: prev.canonicalKey, score };
      }
    }
    if (best) {
      replacedNodeKeys.push(best.key);
      consumedPrev.add(best.key);
    } else {
      newNodes.push({
        canonicalKey: reti.canonicalKey,
        title: reti.title,
        rawText: reti.rawText,
      });
    }
  }

  // Keep previous leaves that were not replaced; drop replaced.
  const keptPrev = prevLeaves.filter((n) => !consumedPrev.has(n.canonicalKey));

  // Rebuild merged draft: subjects from retificação (or previous), then leaves.
  const mergedNodes: SyllabusNodeDraft[] = [];
  let ordinal = 0;
  const subjectTitles = new Map<string, string>();

  for (const s of retiSubjects) {
    subjectTitles.set(subjectKey(s), s.title);
    mergedNodes.push({ ...s, ordinal: ordinal++ });
  }

  // Ensure subjects for kept previous leaves exist
  for (const prev of keptPrev) {
    const sk = subjectKey(prev);
    if (![...subjectTitles.keys()].some((k) => k === sk || tokenSetRatio(k, sk) >= 80)) {
      const title = prev.title.split(/[▸>]/)[0]?.trim() || prev.title;
      subjectTitles.set(sk, title);
      mergedNodes.push({
        depth: 0,
        ordinal: ordinal++,
        title,
        rawText: title,
        pathSlug: sk.replace(/\s+/g, "-"),
        canonicalSubjectId: null,
        canonicalKey: sk.replace(/\s+/g, "-"),
        scope: "basic",
        positionSlugs: ["geral"],
        parentPathSlug: null,
        extraction: { method: "outline", confidence: 0.7, sourceSectionId: "retificacao-carry" },
      });
    }
  }

  for (const reti of retiLeaves) {
    const parent =
      [...subjectTitles.entries()].find(([k]) => k === subjectKey(reti) || tokenSetRatio(k, subjectKey(reti)) >= 80)?.[0] ??
      subjectKey(reti);
    const parentSlug = parent.replace(/\s+/g, "-");
    mergedNodes.push({
      ...reti,
      ordinal: ordinal++,
      parentPathSlug: reti.parentPathSlug ?? parentSlug,
    });
  }

  for (const prev of keptPrev) {
    const parent =
      [...subjectTitles.entries()].find(([k]) => k === subjectKey(prev) || tokenSetRatio(k, subjectKey(prev)) >= 80)?.[0] ??
      subjectKey(prev);
    const parentSlug = parent.replace(/\s+/g, "-");
    mergedNodes.push({
      depth: (prev.depth as 0 | 1 | 2 | 3) || 1,
      ordinal: ordinal++,
      title: prev.title,
      rawText: prev.rawText ?? prev.title,
      pathSlug: prev.pathSlug ?? prev.canonicalKey,
      canonicalSubjectId: null,
      canonicalKey: prev.canonicalKey,
      scope: "basic",
      positionSlugs: ["geral"],
      parentPathSlug: parentSlug,
      extraction: { method: "outline", confidence: 0.75, sourceSectionId: "retificacao-keep" },
    });
  }

  return {
    replacedNodeKeys,
    retiredNodeKeys: replacedNodeKeys, // replaced previous keys are retired from the active tree
    newNodes,
    mergedNodes,
  };
}

/** Async wrapper kept for call sites that previously awaited a stub. */
export async function applyRetificacaoDelta(
  previous: PreviousSyllabusNode[],
  retificacaoNodes: SyllabusNodeDraft[],
): Promise<SyllabusDelta> {
  return computeRetificacaoDelta(previous, retificacaoNodes);
}
