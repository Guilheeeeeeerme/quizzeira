"""EPUB extraction via ebooklib."""
from __future__ import annotations

import re
from typing import Any

from ..schema import Block, Table
from .html import _strip_html


def extract(raw: bytes) -> tuple[list[Block], list[Table], dict[str, Any], dict[str, Any]]:
    try:
        import ebooklib  # type: ignore
        from ebooklib import epub  # type: ignore
    except ImportError as exc:
        raise ValueError("ebooklib_unavailable") from exc

    book = epub.read_epub(raw if False else __import__("io").BytesIO(raw))
    blocks: list[Block] = []
    for item in book.get_items():
        if item.get_type() != ebooklib.ITEM_DOCUMENT:
            continue
        html = item.get_content().decode("utf-8", errors="replace")
        title = item.get_name()
        blocks.append(Block(type="heading", text=title, level=1))
        text = _strip_html(html)
        for para in re.split(r"\n{2,}", text):
            para = para.strip()
            if para:
                blocks.append(Block(type="paragraph", text=para))
    extractor = {"engine": "ebooklib", "version": "1", "options": {}}
    return blocks, [], extractor, {"title": None, "author": None, "date": None, "sitename": None}
