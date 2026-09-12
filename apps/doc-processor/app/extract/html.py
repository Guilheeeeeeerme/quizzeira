"""HTML extraction — trafilatura when available, else readability/tag strip."""
from __future__ import annotations

import re
from typing import Any

from ..schema import Block, Table


def extract(raw: bytes) -> tuple[list[Block], list[Table], dict[str, Any], dict[str, Any]]:
    text = raw.decode("utf-8", errors="replace")
    metadata: dict[str, Any] = {"title": None, "author": None, "date": None, "sitename": None}
    engine = "html-strip"
    main = ""

    try:
        import trafilatura  # type: ignore

        extracted = trafilatura.bare_extraction(
            text,
            favor_precision=True,
            include_tables=True,
            with_metadata=True,
        )
        if extracted:
            main = extracted.get("text") or ""
            metadata = {
                "title": extracted.get("title"),
                "author": extracted.get("author"),
                "date": extracted.get("date"),
                "sitename": extracted.get("sitename"),
            }
            engine = "trafilatura"
    except Exception:
        main = ""

    if not main:
        main = _strip_html(text)
        engine = "html-strip"

    blocks: list[Block] = []
    for para in re.split(r"\n{2,}", main):
        para = para.strip()
        if not para:
            continue
        if len(para) <= 120 and para.isupper():
            blocks.append(Block(type="heading", text=para, level=1))
        elif re.match(r"^(\d+(\.\d+)*|[IVXLC]+)[.)\-–]\s+\S", para):
            blocks.append(Block(type="list_item", text=para, level=1))
        else:
            blocks.append(Block(type="paragraph", text=para))

    extractor = {"engine": engine, "version": "1", "options": {"favor_precision": True}}
    return blocks, [], extractor, metadata


def _strip_html(html: str) -> str:
    html = re.sub(r"(?is)<(script|style|nav|header|footer|aside|form)[^>]*>.*?</\1>", " ", html)
    html = re.sub(r"(?is)<!--.*?-->", " ", html)
    html = re.sub(r"(?i)<br\s*/?>", "\n", html)
    html = re.sub(r"(?i)</p>", "\n\n", html)
    html = re.sub(r"(?i)</h[1-6]>", "\n\n", html)
    html = re.sub(r"<[^>]+>", " ", html)
    html = re.sub(r"[ \t]+", " ", html)
    html = re.sub(r"\n{3,}", "\n\n", html)
    return html.strip()
