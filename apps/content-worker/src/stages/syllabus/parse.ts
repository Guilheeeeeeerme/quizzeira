/** Deterministic syllabus outline parser (§15). */

import {
  canonicalKey,
  resolveCanonicalSubject,
  slugifyKey,
} from "@quizzeira/shared";

export interface ParsedSyllabusNode {
  depth: 0 | 1 | 2 | 3;
  ordinal: number;
  title: string;
  rawText: string;
  path: string[];
  pathSlug: string;
  canonicalSubjectId: string | null;
  canonicalKey: string;
  scope: "basic" | "specific";
}

const SUBJECT_RE =
  /^(L[IÍ]NGUA\s+PORTUGUESA|MATEM[AÁ]TICA|RACIOC[IÍ]NIO\s+L[OÓ]GICO|DIREITO\s+\w+|INFORM[AÁ]TICA|CONTABILIDADE|ADMINISTRA[CÇ][AÃ]O|CONTROLE\s+EXTERNO|ATUALIDADES|CONHECIMENTOS\s+(B[AÁ]SICOS|ESPEC[IÍ]FICOS))(?:\s*[:.\-–]|\s*$)/i;

const ITEM_RE = /^\s*(\d+)[.)]\s+(.+)$/;
const SUB_RE = /^\s*(\d+\.\d+)[.)]?\s+(.+)$/;

export function parseSyllabusOutline(text: string): ParsedSyllabusNode[] {
  const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const nodes: ParsedSyllabusNode[] = [];
  let subject: string | null = null;
  let topic: string | null = null;
  let ordinal = 0;

  for (const line of lines) {
    if (SUBJECT_RE.test(line) || (line === line.toUpperCase() && line.length > 8 && line.length < 80)) {
      subject = line.replace(/[:.\-–]\s*$/, "").trim();
      topic = null;
      const canon = resolveCanonicalSubject(subject);
      const path = [subject];
      nodes.push({
        depth: 0,
        ordinal: ordinal++,
        title: subject,
        rawText: line,
        path,
        pathSlug: path.map(slugifyKey).join("/"),
        canonicalSubjectId: canon?.id ?? null,
        canonicalKey: canonicalKey(canon?.id ?? null, subject),
        scope: /espec[ií]fico/i.test(subject) ? "specific" : "basic",
      });
      continue;
    }

    const sub = SUB_RE.exec(line);
    if (sub && subject) {
      const title = sub[2].trim();
      const path = [subject, topic ?? title, topic ? title : undefined].filter(Boolean) as string[];
      const depth = topic ? 2 : 1;
      if (!topic) topic = title;
      const canon = resolveCanonicalSubject(subject);
      nodes.push({
        depth: depth as 1 | 2,
        ordinal: ordinal++,
        title,
        rawText: line,
        path,
        pathSlug: path.map(slugifyKey).join("/"),
        canonicalSubjectId: canon?.id ?? null,
        canonicalKey: canonicalKey(canon?.id ?? null, title),
        scope: /espec[ií]fico/i.test(subject) ? "specific" : "basic",
      });
      continue;
    }

    const item = ITEM_RE.exec(line);
    if (item && subject) {
      const title = item[2].trim();
      topic = title;
      const path = [subject, title];
      const canon = resolveCanonicalSubject(subject);
      nodes.push({
        depth: 1,
        ordinal: ordinal++,
        title,
        rawText: line,
        path,
        pathSlug: path.map(slugifyKey).join("/"),
        canonicalSubjectId: canon?.id ?? null,
        canonicalKey: canonicalKey(canon?.id ?? null, title),
        scope: /espec[ií]fico/i.test(subject) ? "specific" : "basic",
      });
    }
  }

  return nodes;
}
