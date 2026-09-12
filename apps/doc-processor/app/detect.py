"""Format detection and PDF text-layer probing."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class DocumentFormat(str, Enum):
    PDF = "pdf"
    HTML = "html"
    DOCX = "docx"
    DOC = "doc"
    PPTX = "pptx"
    PPT = "ppt"
    PLAIN = "plain"
    EPUB = "epub"
    UNKNOWN = "unknown"


@dataclass
class DetectionResult:
    format: DocumentFormat
    content_type: str
    has_text_layer: bool | None = None
    text_layer_ratio: float | None = None


def _starts_with(data: bytes, prefix: bytes) -> bool:
    return len(data) >= len(prefix) and data[: len(prefix)] == prefix


def detect_format(data: bytes, content_type: str | None = None) -> DetectionResult:
    ct = (content_type or "").lower().split(";")[0].strip()

    if _starts_with(data, b"%PDF"):
        return DetectionResult(DocumentFormat.PDF, ct or "application/pdf")

    if _starts_with(data, b"PK\x03\x04"):
        head = data[:4096]
        if b"word/" in head:
            return DetectionResult(
                DocumentFormat.DOCX,
                ct or "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
        if b"ppt/" in head:
            return DetectionResult(
                DocumentFormat.PPTX,
                ct or "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            )
        if b"mimetype" in head and b"application/epub+zip" in head:
            return DetectionResult(DocumentFormat.EPUB, ct or "application/epub+zip")

    if _starts_with(data, b"\xd0\xcf\x11\xe0"):
        return DetectionResult(DocumentFormat.DOC, ct or "application/msword")

    if ct in ("text/html", "application/xhtml+xml") or _looks_like_html(data):
        return DetectionResult(DocumentFormat.HTML, ct or "text/html")

    if ct.startswith("text/") or ct in ("application/json", "application/xml"):
        return DetectionResult(DocumentFormat.PLAIN, ct or "text/plain")

    if _looks_like_html(data):
        return DetectionResult(DocumentFormat.HTML, "text/html")

    if _is_mostly_text(data):
        return DetectionResult(DocumentFormat.PLAIN, ct or "text/plain")

    return DetectionResult(DocumentFormat.UNKNOWN, ct or "application/octet-stream")


def _looks_like_html(data: bytes) -> bool:
    sample = data[:8192].lower()
    return b"<html" in sample or b"<!doctype html" in sample or (b"<body" in sample and b"<" in sample)


def _is_mostly_text(data: bytes) -> bool:
    if not data:
        return True
    sample = data[:4096]
    printable = sum(1 for b in sample if b in (9, 10, 13) or 32 <= b <= 126 or b >= 128)
    return printable / len(sample) >= 0.85


def probe_pdf_text_layer(data: bytes, sample_pages: int = 5) -> tuple[bool, float]:
    """Return (has_text_layer, ratio) using PyMuPDF when available."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return False, 0.0

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return False, 0.0

    try:
        page_count = doc.page_count
        if page_count == 0:
            return False, 0.0

        indices = _sample_page_indices(page_count, sample_pages)
        pages_with_text = 0
        for idx in indices:
            text = doc.load_page(idx).get_text("text").strip()
            if len(text) >= 10:
                pages_with_text += 1

        ratio = pages_with_text / len(indices)
        return ratio >= 0.5, ratio
    finally:
        doc.close()


def _sample_page_indices(page_count: int, sample_pages: int) -> list[int]:
    if page_count <= sample_pages:
        return list(range(page_count))
    step = max(1, page_count // sample_pages)
    indices = list(range(0, page_count, step))[:sample_pages]
    if indices[-1] != page_count - 1:
        indices.append(page_count - 1)
    return sorted(set(indices))
