"""PDF extraction via PyMuPDF (primary)."""

from __future__ import annotations

from dataclasses import dataclass

from app.layout.columns import RawBlock, join_lines_to_paragraphs, order_blocks_in_reading_order
from app.schema import Block, ExtractorInfo, FontStats, Metadata, Table


@dataclass
class PdfExtractResult:
    blocks: list[Block]
    tables: list[Table]
    metadata: Metadata
    pages: int
    text_layer_ratio: float | None
    extractor: ExtractorInfo


def _pymupdf_version() -> str:
    try:
        import fitz

        return fitz.__doc__.split()[1] if fitz.__doc__ else "unknown"
    except Exception:
        return "unknown"


def extract_pdf(data: bytes, role_hint: str | None = None) -> PdfExtractResult:
    import fitz

    doc = fitz.open(stream=data, filetype="pdf")
    try:
        raw_blocks: list[RawBlock] = []
        tables: list[Table] = []
        page_count = doc.page_count
        pages_with_text = 0

        for page_idx in range(page_count):
            page = doc.load_page(page_idx)
            page_num = page_idx + 1
            plain = page.get_text("text").strip()
            if len(plain) >= 10:
                pages_with_text += 1

            page_dict = page.get_text("dict", sort=True)
            page_width = float(page.rect.width)
            line_blocks: list[RawBlock] = []

            for block in page_dict.get("blocks", []):
                if block.get("type") != 0:
                    continue
                for line in block.get("lines", []):
                    spans = line.get("spans", [])
                    if not spans:
                        continue
                    text = "".join(span.get("text", "") for span in spans).strip()
                    if not text:
                        continue
                    sizes = [float(span.get("size", 0)) for span in spans if span.get("size")]
                    font_size = max(sizes) if sizes else None
                    bold = any("bold" in (span.get("font", "") or "").lower() for span in spans)
                    bbox = line.get("bbox", block.get("bbox", [0, 0, 0, 0]))
                    line_blocks.append(
                        RawBlock(
                            text=text,
                            x0=float(bbox[0]),
                            y0=float(bbox[1]),
                            x1=float(bbox[2]),
                            y1=float(bbox[3]),
                            page=page_num,
                            font_size=font_size,
                            bold=bold,
                        )
                    )

            ordered = order_blocks_in_reading_order(line_blocks, page_width)
            merged = join_lines_to_paragraphs(ordered)
            raw_blocks.extend(merged)

        text_layer_ratio = pages_with_text / page_count if page_count else 0.0
        body_font = _median_font_size(raw_blocks)
        blocks = [_raw_to_block(rb, body_font) for rb in raw_blocks if rb.text.strip()]

        meta = Metadata(
            title=doc.metadata.get("title") or None,
            author=doc.metadata.get("author") or None,
            date=doc.metadata.get("creationDate") or doc.metadata.get("modDate") or None,
            sitename=None,
        )

        return PdfExtractResult(
            blocks=blocks,
            tables=tables,
            metadata=meta,
            pages=page_count,
            text_layer_ratio=text_layer_ratio,
            extractor=ExtractorInfo(
                engine="pymupdf",
                version=_pymupdf_version(),
                options={"roleHint": role_hint} if role_hint else {},
            ),
        )
    finally:
        doc.close()


def _median_font_size(blocks: list[RawBlock]) -> float:
    sizes = [b.font_size for b in blocks if b.font_size and b.font_size > 0]
    if not sizes:
        return 12.0
    sizes.sort()
    return sizes[len(sizes) // 2]


def _raw_to_block(raw: RawBlock, body_font: float) -> Block:
    block_type = "paragraph"
    level: int | None = None
    if raw.font_size and raw.font_size >= body_font * 1.15 and len(raw.text) <= 120:
        block_type = "heading"
        if raw.font_size >= body_font * 1.5:
            level = 1
        elif raw.font_size >= body_font * 1.3:
            level = 2
        else:
            level = 3

    return Block(
        type=block_type,
        text=raw.text,
        level=level,
        page=raw.page,
        bbox=(raw.x0, raw.y0, raw.x1, raw.y1),
        fontStats=FontStats(size=raw.font_size, bold=raw.bold) if raw.font_size else None,
    )
