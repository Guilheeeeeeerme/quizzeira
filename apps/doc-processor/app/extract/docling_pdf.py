"""Optional Docling PDF/DOCX path (§12.1 / §37.1). Soft-depends on `docling` extra."""

from __future__ import annotations

from dataclasses import dataclass

from app.schema import Block, ExtractorInfo, Metadata, Table


@dataclass
class DoclingExtractResult:
    blocks: list[Block]
    tables: list[Table]
    metadata: Metadata
    pages: int | None
    extractor: ExtractorInfo


def docling_available() -> bool:
    try:
        import docling  # noqa: F401

        return True
    except ImportError:
        return False


def extract_with_docling(data: bytes, *, filename: str = "document.pdf") -> DoclingExtractResult | None:
    """Best-effort Docling conversion when the optional dependency is installed."""
    if not docling_available():
        return None

    try:
        from docling.document_converter import DocumentConverter  # type: ignore
        from pathlib import Path
        import tempfile
    except ImportError:
        return None

    suffix = Path(filename).suffix or ".pdf"
    try:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=True) as tmp:
            tmp.write(data)
            tmp.flush()
            converter = DocumentConverter()
            result = converter.convert(tmp.name)
            doc = result.document
            text = doc.export_to_markdown() if hasattr(doc, "export_to_markdown") else str(doc)
    except Exception:
        return None

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        return None

    blocks = [Block(type="paragraph", text=p) for p in paragraphs]
    version = "unknown"
    try:
        import docling as _docling

        version = getattr(_docling, "__version__", "unknown")
    except Exception:
        pass

    return DoclingExtractResult(
        blocks=blocks,
        tables=[],
        metadata=Metadata(title=None, author=None, date=None, sitename=None),
        pages=None,
        extractor=ExtractorInfo(engine="docling", version=str(version), options={"source": filename}),
    )
