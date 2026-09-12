"""Quizzeira doc-processor — PDF/HTML/DOCX/OCR normalization service (§12)."""

from __future__ import annotations

import re
import time
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="quizzeira-doc-processor", version="0.1.0")


class ProcessRequest(BaseModel):
    content_type: str = Field(..., alias="contentType")
    filename: str | None = None
    # base64 bytes
    base64: str
    hints: dict[str, Any] = Field(default_factory=dict)

    class Config:
        populate_by_name = True


class ProcessResponse(BaseModel):
    version: str = "normalized-document/v1"
    contentType: str
    language: str = "pt"
    title: str | None = None
    text: str
    sections: list[dict[str, Any]]
    tables: list[Any] = Field(default_factory=list)
    stats: dict[str, Any]
    cleaningLog: list[dict[str, Any]]
    extractor: str
    extractedAt: str


def _decode_base64(data: str) -> bytes:
    import base64

    return base64.b64decode(data)


def _clean_text(text: str) -> tuple[str, list[dict[str, Any]]]:
    events: list[dict[str, Any]] = []
    before = len(text)
    text = re.sub(r"\r\n?", "\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    # boilerplate lines
    lines = []
    removed = 0
    for line in text.split("\n"):
        if re.match(
            r"^(voltar|home|cookie|aceitar|privacidade|copyright|menu|login)\b",
            line.strip(),
            re.I,
        ):
            removed += len(line)
            continue
        lines.append(line)
    text = "\n".join(lines)
    if removed:
        events.append({"rule": "boilerplate_lines", "removedChars": removed})
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.M)
    text = re.sub(r"p[aá]gina\s+\d+\s+de\s+\d+", "", text, flags=re.I)
    text = re.sub(r"[ \t]{2,}", " ", text).strip()
    if len(text) < before:
        events.append({"rule": "normalize", "removedChars": before - len(text)})
    return text, events


def _section(text: str) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    current_heading: str | None = None
    buf: list[str] = []

    def flush() -> None:
        body = "\n".join(buf).strip()
        if not body and not current_heading:
            return
        sections.append(
            {
                "ordinal": len(sections),
                "path": [current_heading] if current_heading else [],
                "heading": current_heading,
                "level": 1 if current_heading else 0,
                "text": body or (current_heading or ""),
            }
        )

    for line in text.split("\n"):
        t = line.strip()
        if re.match(r"^(ANEXO|CAP[IÍ]TULO|DAS?\s+|CONTE[UÚ]DO\s+PROGRAM|#{1,6}\s+)", t, re.I) or (
            t.isupper() and 8 <= len(t) <= 80
        ):
            if buf or current_heading:
                flush()
                buf = []
            current_heading = re.sub(r"^#+\s*", "", t)
        else:
            buf.append(line)
    flush()
    if not sections and text.strip():
        sections = [
            {
                "ordinal": 0,
                "path": [],
                "heading": None,
                "level": 0,
                "text": text.strip(),
            }
        ]
    return sections


def _extract_html(raw: bytes) -> tuple[str, str]:
    try:
        import trafilatura

        html = raw.decode("utf-8", errors="replace")
        extracted = trafilatura.extract(html) or ""
        if extracted.strip():
            return extracted, "trafilatura"
    except Exception:
        pass
    html = raw.decode("utf-8", errors="replace")
    text = re.sub(r"(?is)<(script|style|nav|footer|header).*?>.*?</\1>", " ", html)
    text = re.sub(r"(?is)<br\s*/?>", "\n", text)
    text = re.sub(r"(?is)</(p|div|h[1-6]|li)>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    return text, "html-regex"


def _extract_pdf(raw: bytes) -> tuple[str, str, bool]:
    ocr_used = False
    # Prefer PyMuPDF
    try:
        import fitz  # PyMuPDF

        doc = fitz.open(stream=raw, filetype="pdf")
        parts: list[str] = []
        for page in doc:
            parts.append(page.get_text("text"))
        text = "\n".join(parts).strip()
        if len(text) >= 80:
            return text, "pymupdf", False
        # OCR fallback for scanned pages
        try:
            import pytesseract
            from PIL import Image
            import io

            ocr_parts: list[str] = []
            for page in doc:
                pix = page.get_pixmap(dpi=200)
                img = Image.open(io.BytesIO(pix.tobytes("png")))
                ocr_parts.append(pytesseract.image_to_string(img, lang="por+eng"))
            ocr_text = "\n".join(ocr_parts).strip()
            if ocr_text:
                return ocr_text, "pymupdf+tesseract", True
        except Exception:
            pass
        return text, "pymupdf", False
    except Exception:
        pass

    # Docling optional
    try:
        from docling.document_converter import DocumentConverter
        import tempfile
        import os

        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(raw)
            path = tmp.name
        try:
            conv = DocumentConverter()
            result = conv.convert(path)
            text = result.document.export_to_markdown()
            return text, "docling", False
        finally:
            os.unlink(path)
    except Exception:
        pass

    return "", "pdf-none", ocr_used


def _extract_docx(raw: bytes) -> tuple[str, str]:
    try:
        import io
        from docx import Document

        doc = Document(io.BytesIO(raw))
        text = "\n".join(p.text for p in doc.paragraphs)
        return text, "python-docx"
    except Exception:
        return raw.decode("utf-8", errors="replace"), "docx-fallback"


def _extract_epub(raw: bytes) -> tuple[str, str]:
    try:
        import ebooklib
        from ebooklib import epub
        from bs4 import BeautifulSoup
        import io

        book = epub.read_epub(io.BytesIO(raw))
        parts: list[str] = []
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                soup = BeautifulSoup(item.get_content(), "html.parser")
                parts.append(soup.get_text("\n"))
        return "\n".join(parts), "ebooklib"
    except Exception:
        return "", "epub-none"


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "doc-processor"}


@app.post("/process", response_model=ProcessResponse)
def process(req: ProcessRequest) -> ProcessResponse:
    started = time.time()
    try:
        raw = _decode_base64(req.base64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"invalid base64: {exc}") from exc

    ctype = (req.content_type or "").lower()
    name = (req.filename or "").lower()
    ocr_used = False

    if "html" in ctype or name.endswith((".html", ".htm")):
        text, extractor = _extract_html(raw)
    elif "pdf" in ctype or name.endswith(".pdf"):
        text, extractor, ocr_used = _extract_pdf(raw)
    elif (
        "word" in ctype
        or "officedocument.wordprocessingml" in ctype
        or name.endswith((".docx", ".doc"))
    ):
        text, extractor = _extract_docx(raw)
    elif "epub" in ctype or name.endswith(".epub"):
        text, extractor = _extract_epub(raw)
    else:
        text, extractor = raw.decode("utf-8", errors="replace"), "plain"

    cleaned, cleaning_log = _clean_text(text)
    sections = _section(cleaned)
    elapsed_ms = int((time.time() - started) * 1000)

    return ProcessResponse(
        contentType=req.content_type,
        language="pt",
        title=req.hints.get("title"),
        text=cleaned,
        sections=sections,
        tables=[],
        stats={
            "charCount": len(cleaned),
            "ocrUsed": ocr_used,
            "elapsedMs": elapsed_ms,
        },
        cleaningLog=cleaning_log,
        extractor=extractor,
        extractedAt=datetime.now(timezone.utc).isoformat(),
    )
