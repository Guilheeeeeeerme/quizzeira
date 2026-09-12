"""End-to-end bytes → NormalizedDocument pipeline."""

from __future__ import annotations

import hashlib
import re
from datetime import datetime, timezone

from app.clean import run_cleaning_pipeline
from app.detect import DocumentFormat, detect_format, probe_pdf_text_layer
from app.extract.docling_pdf import extract_with_docling
from app.extract.html import extract_html
from app.extract.libreoffice import convert_with_libreoffice
from app.extract.office import extract_docx
from app.extract.pdf import extract_pdf
from app.extract.plain import extract_plain
from app.schema import Block, CleaningLogEntry, ExtractorInfo, NormalizedDocument, Stats
from app.structure.sections import build_sections


def content_hash(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _guess_language(blocks: list[Block]) -> str:
    sample = " ".join(b.text for b in blocks[:40])[:4000]
    if not sample.strip():
        return "unknown"
    pt_hits = len(re.findall(r"\b(de|da|do|para|com|não|questão|prova|concurso)\b", sample, re.I))
    en_hits = len(re.findall(r"\b(the|and|for|with|question|exam)\b", sample, re.I))
    if pt_hits >= en_hits:
        return "pt"
    if en_hits > pt_hits:
        return "en"
    return "pt"


def _blocks_by_type(blocks: list[Block]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for block in blocks:
        counts[block.type] = counts.get(block.type, 0) + 1
    return counts


def _total_chars(blocks: list[Block]) -> int:
    return sum(len(b.text) for b in blocks)


def _try_ocr_pdf(data: bytes) -> tuple[list[Block], float | None]:
    """Best-effort OCR via PyMuPDF Tessseract integration when available."""
    try:
        import fitz
    except ImportError:
        return [], None

    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        return [], None

    blocks: list[Block] = []
    confidences: list[float] = []
    try:
        for page_idx in range(doc.page_count):
            page = doc.load_page(page_idx)
            try:
                tp = page.get_textpage_ocr()  # type: ignore[attr-defined]
                text = page.get_text("text", textpage=tp).strip()
            except Exception:
                text = ""
            if text:
                blocks.append(Block(type="paragraph", text=text, page=page_idx + 1))
                confidences.append(0.7)
    finally:
        doc.close()

    if not blocks:
        return [], None
    avg = sum(confidences) / len(confidences) if confidences else None
    return blocks, avg


def process_document(
    data: bytes,
    *,
    document_id: str,
    content_type: str,
    url: str | None = None,
    role_hint: str | None = None,
) -> NormalizedDocument:
    detection = detect_format(data, content_type)
    fmt = detection.format
    chash = content_hash(data)
    fetched_at = datetime.now(timezone.utc).isoformat()

    blocks: list[Block] = []
    tables = []
    metadata = None
    extractor = None
    pages: int | None = None
    text_layer_ratio: float | None = None
    ocr_confidence: float | None = None
    link_density = 0.0
    pending_clean: list[CleaningLogEntry] = []

    if fmt == DocumentFormat.PDF:
        has_layer, ratio = probe_pdf_text_layer(data)
        text_layer_ratio = ratio
        pdf_result = extract_pdf(data, role_hint=role_hint)
        blocks = pdf_result.blocks
        tables = pdf_result.tables
        metadata = pdf_result.metadata
        extractor = pdf_result.extractor
        pages = pdf_result.pages
        if not has_layer:
            text_layer_ratio = ratio

        needs_ocr = (text_layer_ratio is not None and text_layer_ratio < 0.15) or (
            _total_chars(blocks) < 40 and (pages or 0) > 0
        )
        if needs_ocr and role_hint in (None, "specification", "evidence", "knowledge"):
            ocr_blocks, ocr_conf = _try_ocr_pdf(data)
            if ocr_blocks:
                blocks = ocr_blocks
                ocr_confidence = ocr_conf
                extractor = ExtractorInfo(
                    engine="pymupdf",
                    version=extractor.version if extractor else "unknown",
                    options={**(extractor.options if extractor else {}), "ocr": True},
                )
                pending_clean.append(
                    CleaningLogEntry(step="ocr_routing", removed=0, sample="ocr_applied")
                )
            else:
                # Prefer Docling layout recovery before giving up on thin text layers.
                docling = extract_with_docling(data, filename="document.pdf")
                if docling and _total_chars(docling.blocks) > _total_chars(blocks):
                    blocks = docling.blocks
                    tables = docling.tables or tables
                    metadata = docling.metadata or metadata
                    extractor = docling.extractor
                    pending_clean.append(
                        CleaningLogEntry(step="docling_fallback", removed=0, sample="docling_applied")
                    )
                else:
                    pending_clean.append(
                        CleaningLogEntry(
                            step="ocr_routing",
                            removed=0,
                            sample="ocr_needed_but_unavailable",
                        )
                    )
    elif fmt == DocumentFormat.HTML:
        html_result = extract_html(data, url=url)
        blocks = html_result.blocks
        tables = html_result.tables
        metadata = html_result.metadata
        extractor = html_result.extractor
        link_density = html_result.link_density
    elif fmt == DocumentFormat.DOCX:
        office_result = extract_docx(data)
        blocks = office_result.blocks
        tables = office_result.tables
        metadata = office_result.metadata
        extractor = office_result.extractor
    elif fmt in (
        DocumentFormat.DOC,
        DocumentFormat.PPT,
        DocumentFormat.PPTX,
        DocumentFormat.EPUB,
    ):
        converted = convert_with_libreoffice(data, fmt)
        if converted and converted[:4] == b"%PDF":
            pdf_result = extract_pdf(converted, role_hint=role_hint)
            blocks = pdf_result.blocks
            tables = pdf_result.tables
            metadata = pdf_result.metadata
            pages = pdf_result.pages
            extractor = ExtractorInfo(
                engine="libreoffice+docling",
                version=pdf_result.extractor.version,
                options={"via": "libreoffice-pdf", "sourceFormat": fmt.value},
            )
        elif converted and converted[:2] == b"PK":
            office_result = extract_docx(converted)
            blocks = office_result.blocks
            tables = office_result.tables
            metadata = office_result.metadata
            extractor = ExtractorInfo(
                engine="libreoffice+docling",
                version=office_result.extractor.version,
                options={"via": "libreoffice-docx", "sourceFormat": fmt.value},
            )
        else:
            docling = extract_with_docling(
                data,
                filename=f"document.{fmt.value}",
            )
            if docling:
                blocks = docling.blocks
                tables = docling.tables
                metadata = docling.metadata
                extractor = docling.extractor
            else:
                raise ValueError(f"unsupported_format:{fmt.value}")
    elif fmt == DocumentFormat.UNKNOWN:
        raise ValueError("unsupported_format")
    else:
        plain_result = extract_plain(data, detection.content_type)
        blocks = plain_result.blocks
        tables = plain_result.tables
        metadata = plain_result.metadata
        extractor = plain_result.extractor

    blocks, cleaning_log = run_cleaning_pipeline(
        blocks,
        role_hint=role_hint,
        document_id=document_id,
        url=url,
    )
    cleaning_log = [*pending_clean, *cleaning_log]
    sections = build_sections(document_id, blocks, tables)

    language = _guess_language(blocks)
    stats = Stats(
        pages=pages,
        chars=_total_chars(blocks),
        textLayerRatio=text_layer_ratio,
        ocrConfidence=ocr_confidence,
        language=language,
        blocksByType=_blocks_by_type(blocks),
        linkDensity=link_density,
    )

    return NormalizedDocument(
        documentId=document_id,
        contentHash=chash,
        source={
            "url": url,
            "contentType": detection.content_type or content_type,
            "byteSize": len(data),
            "fetchedAt": fetched_at,
        },
        extractor=extractor,
        stats=stats,
        metadata=metadata,
        blocks=blocks,
        sections=sections,
        tables=tables,
        cleaningLog=cleaning_log,
    )
