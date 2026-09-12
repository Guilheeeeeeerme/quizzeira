"""Format detection (§12.1)."""
from __future__ import annotations


def detect_format(raw: bytes, content_type: str | None = None) -> str:
    ct = (content_type or "").lower()
    if raw.startswith(b"%PDF"):
        return "pdf"
    if raw[:4] == b"PK\x03\x04":
        # zip-based: docx / pptx / epub
        lower = raw[:4096].lower()
        if b"word/" in lower or b"word/" in raw[0:65536].lower():
            return "docx"
        if b"ppt/" in lower:
            return "pptx"
        if b"mimetype" in lower and b"epub" in lower:
            return "epub"
        if b"[Content_Types].xml" in raw[:8192]:
            if b"wordprocessingml" in raw[:65536]:
                return "docx"
            if b"presentationml" in raw[:65536]:
                return "pptx"
        return "zip"
    if raw[:8] == b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1":
        return "doc"
    head = raw[:256].lstrip().lower()
    if b"<html" in head or b"<!doctype html" in head or "html" in ct:
        return "html"
    if ct.startswith("text/") or head[:1].isalpha() or b"\n" in head:
        return "txt"
    if raw[:3] in (b"\xff\xd8\xff",) or raw[:8] == b"\x89PNG\r\n\x1a\n":
        return "image"
    return "unknown"


def pdf_has_text_layer(raw: bytes, sample_pages: int = 5) -> tuple[bool, float]:
    """Return (has_text, text_layer_ratio). Uses PyMuPDF when available."""
    try:
        import fitz  # type: ignore
    except ImportError:
        # Heuristic: searchable PDFs often contain 'BT'/'Tj' operators.
        sample = raw[:200_000]
        ops = sample.count(b"Tj") + sample.count(b"TJ")
        return ops >= 10, min(1.0, ops / 50.0)

    doc = fitz.open(stream=raw, filetype="pdf")
    try:
        n = min(len(doc), sample_pages) or 1
        with_text = 0
        for i in range(n):
            text = doc.load_page(i).get_text("text").strip()
            if len(text) >= 10:
                with_text += 1
        ratio = with_text / n
        return ratio >= 0.5, ratio
    finally:
        doc.close()
