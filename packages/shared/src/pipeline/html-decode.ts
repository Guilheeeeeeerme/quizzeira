// Concept: Charset-aware HTML decoding (§13.1 "encoding normalisation").
//
// Brazilian government sites (planalto.gov.br, many tribunais) still serve
// ISO-8859-1 / windows-1252. Decoding those bytes as UTF-8 turns every accented
// character into U+FFFD, which breaks headings, regexes and dedup keys. The
// charset is sniffed from the HTTP header first, then from <meta>, then a BOM;
// UTF-8 is the fallback.

const META_CHARSET_RE = /<meta[^>]+charset=["']?\s*([a-z0-9_:-]+)/i;
const HEADER_CHARSET_RE = /charset=["']?\s*([a-z0-9_:-]+)/i;

const ALIASES: Record<string, string> = {
  "iso-8859-1": "windows-1252",
  latin1: "windows-1252",
  "iso_8859-1": "windows-1252",
  "iso8859-1": "windows-1252",
  "windows-1252": "windows-1252",
  cp1252: "windows-1252",
  "utf8": "utf-8",
  "utf-8": "utf-8",
};

export function sniffHtmlCharset(bytes: Uint8Array, contentType?: string | null): string {
  const fromHeader = contentType ? HEADER_CHARSET_RE.exec(contentType)?.[1] : null;
  if (fromHeader) return normalizeCharset(fromHeader);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) return "utf-8";
  // The <meta> tag is ASCII in every encoding we care about; only scan the head.
  const head = Buffer.from(bytes.subarray(0, Math.min(bytes.length, 4096))).toString("latin1");
  const fromMeta = META_CHARSET_RE.exec(head)?.[1];
  return fromMeta ? normalizeCharset(fromMeta) : "utf-8";
}

function normalizeCharset(label: string): string {
  const key = label.trim().toLowerCase();
  return ALIASES[key] ?? key;
}

/** Bytes → string with the sniffed charset; falls back to UTF-8 on unknown labels. */
export function decodeHtmlBytes(bytes: Uint8Array, contentType?: string | null): { html: string; charset: string } {
  const charset = sniffHtmlCharset(bytes, contentType);
  try {
    const html = new TextDecoder(charset).decode(bytes);
    // A UTF-8 declaration on latin-1 bytes still yields U+FFFD runs; retry once.
    if (charset === "utf-8" && (html.match(/�/g)?.length ?? 0) > 20) {
      return { html: new TextDecoder("windows-1252").decode(bytes), charset: "windows-1252" };
    }
    return { html, charset };
  } catch {
    return { html: new TextDecoder("utf-8").decode(bytes), charset: "utf-8" };
  }
}
