// Concept: Position discovery from vacancies + syllabus headings (§15.1).

import type { NormalizedDocument } from "@quizzeira/shared";
import { tokenSetRatio } from "@quizzeira/shared";
import { slugifyKey } from "@quizzeira/shared";
import type { ClassifiedSection } from "../classify.js";

export interface DiscoveredPosition {
  title: string;
  slug: string;
  implicit: boolean;
  vacancies?: number;
}

function normalizeTitle(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function dedupePositions(positions: DiscoveredPosition[]): DiscoveredPosition[] {
  const out: DiscoveredPosition[] = [];
  for (const p of positions) {
    const dup = out.find((x) => tokenSetRatio(x.title, p.title) >= 90);
    if (!dup) out.push(p);
  }
  return out;
}

function fromVacancyTables(doc: NormalizedDocument): DiscoveredPosition[] {
  const positions: DiscoveredPosition[] = [];
  for (const table of doc.tables) {
    const header = table.rows[0]?.map((c) => c.toLowerCase()) ?? [];
    const cargoIdx = header.findIndex((h) => /cargo/.test(h));
    const vagasIdx = header.findIndex((h) => /vagas?/.test(h));
    if (cargoIdx < 0) continue;
    for (const row of table.rows.slice(1)) {
      const title = normalizeTitle(row[cargoIdx] ?? "");
      if (!title) continue;
      const vacancies = vagasIdx >= 0 ? Number(row[vagasIdx]) : undefined;
      positions.push({
        title,
        slug: slugifyKey(title),
        implicit: false,
        vacancies: Number.isFinite(vacancies) ? vacancies : undefined,
      });
    }
  }
  return positions;
}

function fromSectionText(sections: ClassifiedSection[]): DiscoveredPosition[] {
  const positions: DiscoveredPosition[] = [];
  const re = /conhecimentos espec[íi]ficos\s*[—–-]\s*([^\n:]+)/gi;
  for (const { section } of sections) {
    const text = `${section.heading ?? ""}\n${section.text}`;
    for (const m of text.matchAll(re)) {
      const title = normalizeTitle(m[1]);
      if (title.length < 3) continue;
      positions.push({ title, slug: slugifyKey(title), implicit: false });
    }
  }
  const titleRe = /para o cargo de\s+([^\n.;]+)/i;
  const titleBlock = sections[0]?.section.text.slice(0, 800) ?? "";
  const cargoMatch = titleRe.exec(titleBlock);
  if (cargoMatch) {
    positions.push({
      title: normalizeTitle(cargoMatch[1]),
      slug: slugifyKey(cargoMatch[1]),
      implicit: false,
    });
  }
  return positions;
}

export function discoverPositions(
  doc: NormalizedDocument,
  sections: ClassifiedSection[],
): DiscoveredPosition[] {
  const merged = dedupePositions([...fromVacancyTables(doc), ...fromSectionText(sections)]);
  if (merged.length === 0) {
    return [{ title: "geral", slug: "geral", implicit: true }];
  }
  return merged;
}
