// Concept: Document + section role classification (§14 tiers 0–1).
import {
  classifyDocumentRole,
  classifySection,
  scoreSection,
  type DocumentRole,
  type NormalizedDocument,
  type RoleHint,
  kindToHints,
} from "@quizzeira/shared";

export interface ClassifyResult {
  role: DocumentRole;
  roleConfidence: number;
  roleMethod: string;
  subtype: string | null;
  sections: Array<{
    ordinal: number;
    path: string[];
    heading: string | null;
    level: number;
    role: string;
    scores: Record<string, number>;
    charCount: number;
    text: string;
  }>;
}

export function classifyNormalized(
  doc: NormalizedDocument,
  hints: { roleHint?: RoleHint | string | null; kind?: string | null; sourceKind?: string | null },
): ClassifyResult {
  const kindHints = kindToHints(hints.kind);
  const titleBlock = [
    doc.metadata?.title ?? "",
    ...doc.sections.slice(0, 3).map((s) => s.heading ?? ""),
    doc.sections[0]?.text.slice(0, 600) ?? "",
  ]
    .join("\n")
    .slice(0, 600);

  const classified = classifyDocumentRole({
    titleBlock,
    filename: doc.source?.url ?? null,
    url: doc.source?.url ?? null,
    anchorLabel: null,
    headings: doc.sections.map((s) => s.heading).filter(Boolean) as string[],
    blocks: doc.blocks ?? [],
    linkDensity: Number(doc.stats?.linkDensity ?? 0),
    roleHint: (hints.roleHint as RoleHint) || kindHints.roleHint,
    sourceKind: hints.sourceKind ?? null,
    kindHint: kindHints.kindHint,
  });

  const sections = doc.sections.map((section) => {
    const classifiedSection = classifySection({
      heading: section.heading,
      text: section.text,
      path: section.path,
      flags: section.flags,
    });
    const scores = scoreSection({
      text: section.text,
      linkDensity: Number(doc.stats?.linkDensity ?? 0),
    });
    return {
      ordinal: section.ordinal,
      path: section.path,
      heading: section.heading,
      level: section.level,
      role: classifiedSection.role,
      scores: scores as unknown as Record<string, number>,
      charCount: section.charCount,
      text: section.text,
    };
  });

  return {
    role: classified.role,
    roleConfidence: classified.confidence,
    roleMethod: classified.method,
    subtype: classified.subtype,
    sections,
  };
}
