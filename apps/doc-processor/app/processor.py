"""Orchestrate extract → clean → section (§12–13)."""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from .detect import detect_format, pdf_has_text_layer
from .schema import Block, CleaningLogEntry, NormalizedDocument, Section, Table
from .extract import html as html_extract
from .extract import office as office_extract
from .extract import pdf as pdf_extract
from .extract import plain as plain_extract
from .extract import epub as epub_extract
from .clean import encoding, whitespace, hyphenation, ligatures, garbage, boilerplate, page_artifacts, language, minimum
from .structure import sections as section_builder


def process_bytes(
    raw: bytes,
    *,
    document_id: str,
    source_url: str | None,
    content_type: str | None,
    role_hint: str | None = None,
    enable_ocr: bool = False,
) -> NormalizedDocument:
    fmt = detect_format(raw, content_type)
    content_hash = hashlib.sha256(raw).hexdigest()
    cleaning: list[CleaningLogEntry] = []
    tables: list[Table] = []
    metadata: dict[str, Any] = {"title": None, "author": None, "date": None, "sitename": None}
    extractor: dict[str, Any]
    blocks: list[Block]
    stats_extra: dict[str, Any] = {}

    if fmt == "pdf":
        has_text, ratio = pdf_has_text_layer(raw)
        stats_extra["textLayerRatio"] = ratio
        if not has_text and not enable_ocr and role_hint not in ("specification", "evidence"):
            raise ValueError("ocr_required")
        blocks, tables, extractor, metadata = pdf_extract.extract(raw, enable_ocr=enable_ocr or not has_text)
    elif fmt == "html":
        blocks, tables, extractor, metadata = html_extract.extract(raw)
    elif fmt in ("docx", "doc", "pptx"):
        blocks, tables, extractor, metadata = office_extract.extract(raw, fmt)
    elif fmt == "epub":
        blocks, tables, extractor, metadata = epub_extract.extract(raw)
    elif fmt in ("txt", "zip"):
        blocks, tables, extractor, metadata = plain_extract.extract(raw)
    else:
        raise ValueError(f"unsupported_format:{fmt}")

    blocks, step_logs = _clean_pipeline(blocks)
    cleaning.extend(step_logs)

    non_boilerplate = [b for b in blocks if b.type not in ("boilerplate", "garbage", "page_artifact")]
    text_chars = sum(len(b.text) for b in non_boilerplate)
    if text_chars < 400 and role_hint != "evidence":
        raise ValueError("too_short")

    built_sections = section_builder.build_sections(document_id, blocks)
    lang, lang_log = language.detect_language("\n".join(b.text for b in non_boilerplate[:40]))
    cleaning.append(lang_log)

    blocks_by_type: dict[str, int] = {}
    for b in blocks:
        blocks_by_type[b.type] = blocks_by_type.get(b.type, 0) + 1

    link_chars = sum(b.text.count("http") * 20 for b in blocks)
    total_chars = max(1, sum(len(b.text) for b in blocks))
    link_density = min(1.0, link_chars / total_chars)

    return NormalizedDocument(
        documentId=document_id,
        contentHash=content_hash,
        source={
            "url": source_url,
            "contentType": content_type or f"application/{fmt}",
            "byteSize": len(raw),
            "fetchedAt": datetime.now(timezone.utc).isoformat(),
        },
        extractor=extractor,
        stats={
            "pages": stats_extra.get("pages") or extractor.get("pages"),
            "chars": text_chars,
            "textLayerRatio": stats_extra.get("textLayerRatio"),
            "ocrConfidence": extractor.get("ocrConfidence"),
            "language": lang,
            "blocksByType": blocks_by_type,
            "linkDensity": round(link_density, 4),
        },
        metadata=metadata,
        blocks=blocks,
        sections=built_sections,
        tables=tables,
        cleaningLog=cleaning,
    )


def _clean_pipeline(blocks: list[Block]) -> tuple[list[Block], list[CleaningLogEntry]]:
    logs: list[CleaningLogEntry] = []
    blocks, log = encoding.normalize_blocks(blocks)
    logs.append(log)
    blocks, log = ligatures.fix_ligatures(blocks)
    logs.append(log)
    blocks, log = whitespace.normalize_whitespace(blocks)
    logs.append(log)
    blocks, log = hyphenation.repair_hyphenation(blocks)
    logs.append(log)
    blocks, log = page_artifacts.flag_page_artifacts(blocks)
    logs.append(log)
    blocks, log = boilerplate.flag_boilerplate(blocks)
    logs.append(log)
    blocks, log = garbage.flag_garbage(blocks)
    logs.append(log)
    blocks, log = minimum.drop_empty(blocks)
    logs.append(log)
    return blocks, logs
