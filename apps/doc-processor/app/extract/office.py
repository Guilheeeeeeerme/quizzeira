"""Office document extraction (DOCX via python-docx when available)."""

from __future__ import annotations

from dataclasses import dataclass

from app.schema import Block, ExtractorInfo, Metadata, Table


@dataclass
class OfficeExtractResult:
    blocks: list[Block]
    tables: list[Table]
    metadata: Metadata
    extractor: ExtractorInfo


def _python_docx_available() -> bool:
    try:
        import docx  # noqa: F401

        return True
    except ImportError:
        return False


def extract_docx(data: bytes) -> OfficeExtractResult:
    if not _python_docx_available():
        return _fallback_plain(data, "docx-unavailable")

    from docx import Document
    from io import BytesIO

    doc = Document(BytesIO(data))
    blocks: list[Block] = []
    tables: list[Table] = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
        style = (para.style.name or "").lower()
        if style.startswith("heading"):
            level = _heading_level_from_style(style)
            blocks.append(Block(type="heading", text=text, level=level))
        else:
            blocks.append(Block(type="paragraph", text=text))

    for idx, table in enumerate(doc.tables):
        rows: list[list[str]] = []
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            if any(cells):
                rows.append(cells)
        if rows:
            markdown = _table_markdown(rows)
            tables.append(Table(id=f"table-{idx + 1}", rows=rows, markdown=markdown))

    import docx as docx_mod

    return OfficeExtractResult(
        blocks=blocks,
        tables=tables,
        metadata=Metadata(
            title=doc.core_properties.title,
            author=doc.core_properties.author,
            date=str(doc.core_properties.created) if doc.core_properties.created else None,
            sitename=None,
        ),
        extractor=ExtractorInfo(
            engine="python-docx",
            version=getattr(docx_mod, "__version__", "unknown"),
            options={},
        ),
    )


def _heading_level_from_style(style: str) -> int:
    for n in range(1, 7):
        if str(n) in style:
            return n
    return 2


def _table_markdown(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    normalized = [r + [""] * (width - len(r)) for r in rows]
    header = normalized[0]
    sep = ["---"] * width
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(sep) + " |",
    ]
    for row in normalized[1:]:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def _fallback_plain(data: bytes, reason: str) -> OfficeExtractResult:
    from app.extract.plain import extract_plain

    plain = extract_plain(data, "application/octet-stream")
    plain.extractor = ExtractorInfo(
        engine="plain",
        version="1",
        options={"officeFallback": reason},
    )
    return OfficeExtractResult(
        blocks=plain.blocks,
        tables=plain.tables,
        metadata=plain.metadata,
        extractor=plain.extractor,
    )
