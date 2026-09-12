"""PDF extraction via PyMuPDF with column recovery (§12.1, §12.3)."""
from __future__ import annotations

from typing import Any

from ..schema import Block, Table
from ..layout.columns import order_blocks_reading_order


def extract(raw: bytes, enable_ocr: bool = False) -> tuple[list[Block], list[Table], dict[str, Any], dict[str, Any]]:
    try:
        import fitz  # type: ignore
    except ImportError as exc:
        raise ValueError("pymupdf_unavailable") from exc

    doc = fitz.open(stream=raw, filetype="pdf")
    blocks: list[Block] = []
    tables: list[Table] = []
    ocr_confidences: list[float] = []
    try:
        for page_index in range(len(doc)):
            page = doc.load_page(page_index)
            if enable_ocr:
                try:
                    tp = page.get_textpage_ocr(language="por", dpi=200)
                    text = page.get_text("text", textpage=tp)
                    ocr_confidences.append(0.7)
                except Exception:
                    text = page.get_text("text")
                    ocr_confidences.append(0.4)
                for para in _split_paras(text):
                    blocks.append(Block(type="paragraph", text=para, page=page_index + 1))
                continue

            raw_blocks = page.get_text("dict").get("blocks", [])
            page_blocks = []
            for b in raw_blocks:
                if b.get("type") != 0:
                    continue
                lines = []
                sizes = []
                for line in b.get("lines", []):
                    line_text = "".join(span.get("text", "") for span in line.get("spans", []))
                    if line_text.strip():
                        lines.append(line_text)
                    for span in line.get("spans", []):
                        if span.get("size"):
                            sizes.append(float(span["size"]))
                text = " ".join(lines).strip()
                if not text:
                    continue
                bbox = b.get("bbox")
                avg_size = sum(sizes) / len(sizes) if sizes else 11.0
                page_blocks.append(
                    {
                        "text": text,
                        "bbox": list(bbox) if bbox else None,
                        "size": avg_size,
                        "page": page_index + 1,
                    }
                )
            ordered = order_blocks_reading_order(page_blocks, page.rect.width if page.rect else 612)
            body_sizes = [ob["size"] for ob in ordered] or [11.0]
            median = sorted(body_sizes)[len(body_sizes) // 2]
            for ob in ordered:
                is_heading = ob["size"] >= median * 1.15 and len(ob["text"]) <= 120
                blocks.append(
                    Block(
                        type="heading" if is_heading else "paragraph",
                        text=ob["text"],
                        level=1 if is_heading else None,
                        page=ob["page"],
                        bbox=ob.get("bbox"),
                        fontStats={"size": ob["size"]},
                    )
                )
            # Tables via find_tables when available
            try:
                finder = page.find_tables()
                for ti, t in enumerate(finder.tables if finder else []):
                    data = t.extract()
                    if not data:
                        continue
                    headers = [str(c or "") for c in data[0]]
                    rows = [[str(c or "") for c in row] for row in data[1:]]
                    md = _table_md(headers, rows)
                    tables.append(
                        Table(
                            id=f"p{page_index + 1}-t{ti}",
                            page=page_index + 1,
                            headers=headers,
                            rows=rows,
                            markdown=md,
                        )
                    )
                    blocks.append(Block(type="table", text=md, page=page_index + 1))
            except Exception:
                pass
    finally:
        pages = len(doc)
        doc.close()

    ocr_conf = sum(ocr_confidences) / len(ocr_confidences) if ocr_confidences else None
    if ocr_conf is not None and ocr_conf < 0.6 and enable_ocr:
        raise ValueError("ocr_low_confidence")

    extractor = {
        "engine": "pymupdf",
        "version": getattr(__import__("fitz", fromlist=["version"]), "version", (0,))[0]
        if False
        else "pymupdf",
        "options": {"ocr": enable_ocr},
        "pages": pages,
        "ocrConfidence": ocr_conf,
    }
    try:
        import fitz as _fitz  # type: ignore

        extractor["version"] = str(_fitz.version[0]) if isinstance(_fitz.version, (list, tuple)) else str(_fitz.VersionBind)
    except Exception:
        pass

    metadata = {"title": None, "author": None, "date": None, "sitename": None}
    return blocks, tables, extractor, metadata


def _split_paras(text: str) -> list[str]:
    return [p.strip() for p in text.split("\n\n") if p.strip()]


def _table_md(headers: list[str], rows: list[list[str]]) -> str:
    if not headers:
        return ""
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join("---" for _ in headers) + " |",
    ]
    for row in rows:
        padded = row + [""] * max(0, len(headers) - len(row))
        lines.append("| " + " | ".join(padded[: len(headers)]) + " |")
    return "\n".join(lines)
