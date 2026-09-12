"""Plain text / markdown extraction."""
from __future__ import annotations

import re
from typing import Any

from ..schema import Block, Table


def extract(raw: bytes) -> tuple[list[Block], list[Table], dict[str, Any], dict[str, Any]]:
    text = raw.decode("utf-8", errors="replace")
    blocks: list[Block] = []
    for para in re.split(r"\n{2,}", text):
        para = para.strip()
        if not para:
            continue
        if para.startswith("#"):
            level = len(para) - len(para.lstrip("#"))
            blocks.append(Block(type="heading", text=para.lstrip("# ").strip(), level=min(level, 6)))
        else:
            blocks.append(Block(type="paragraph", text=para))
    extractor = {"engine": "plain", "version": "1", "options": {}}
    return blocks, [], extractor, {"title": None, "author": None, "date": None, "sitename": None}
