/** Section splitting by headings (§13 structural parse). */

export interface TextSection {
  ordinal: number;
  heading: string | null;
  level: number;
  path: string[];
  text: string;
}

const HEADING_RE =
  /^(#{1,6})\s+(.+)$|^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-–—,]{8,80})$|^(ANEXO\s+[IVXLC\d]+[^\n]{0,80})$|^(CAP[IÍ]TULO\s+[IVXLC\d]+[^\n]{0,80})$|^(DAS?\s+[A-ZÁÉÍÓÚ][^\n]{4,80})$/gm;

export function sectionText(cleaned: string): TextSection[] {
  const lines = cleaned.split("\n");
  const sections: TextSection[] = [];
  let current: { heading: string | null; level: number; path: string[]; buf: string[] } = {
    heading: null,
    level: 0,
    path: [],
    buf: [],
  };

  const flush = () => {
    const text = current.buf.join("\n").trim();
    if (!text && !current.heading) return;
    sections.push({
      ordinal: sections.length,
      heading: current.heading,
      level: current.level,
      path: current.path.length ? [...current.path] : current.heading ? [current.heading] : [],
      text: text || current.heading || "",
    });
  };

  for (const line of lines) {
    const trimmed = line.trim();
    let isHeading = false;
    let level = 1;
    let heading = trimmed;

    const md = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (md) {
      isHeading = true;
      level = md[1].length;
      heading = md[2].trim();
    } else if (
      /^(ANEXO|CAP[IÍ]TULO|DAS?\s+|CONTE[UÚ]DO\s+PROGRAM)/i.test(trimmed) ||
      (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-–—,]{8,80}$/.test(trimmed) &&
        trimmed.length < 90)
    ) {
      isHeading = true;
      level = 1;
    }

    if (isHeading && current.buf.join("").trim().length > 0) {
      flush();
      current = {
        heading,
        level,
        path: [heading],
        buf: [],
      };
    } else if (isHeading) {
      current.heading = heading;
      current.level = level;
      current.path = [heading];
    } else {
      current.buf.push(line);
    }
  }
  flush();

  if (sections.length === 0 && cleaned.trim()) {
    return [{ ordinal: 0, heading: null, level: 0, path: [], text: cleaned.trim() }];
  }
  return sections;
}

// silence unused if bundlers complain about HEADING_RE
void HEADING_RE;
