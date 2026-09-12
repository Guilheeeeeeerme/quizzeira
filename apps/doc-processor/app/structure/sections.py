"""Section building from blocks (§13.2 / §13.4)."""
from __future__ import annotations

import re

from ..schema import Block, Section

OUTLINE_RE = re.compile(r"^(\d+(\.\d+)*|[IVXLC]+|[A-Z])[.)\-–]\s+\S")
LEGAL_RE = re.compile(r"^(Art\.|Artigo)\s*\d+", re.I)


def build_sections(document_id: str, blocks: list[Block]) -> list[Section]:
    sections: list[Section] = []
    current_heading: str | None = None
    current_level = 1
    current_path: list[str] = []
    start = 0
    body: list[str] = []
    flags: list[str] = []
    ordinal = 0

    def flush(end: int) -> None:
        nonlocal ordinal, body, flags, start
        text = "\n\n".join(body).strip()
        sec_flags = list(flags)
        if current_heading and LEGAL_RE.match(current_heading):
            sec_flags.append("legal_article")
        sections.append(
            Section(
                id=f"{document_id}:{ordinal}",
                ordinal=ordinal,
                path=list(current_path),
                heading=current_heading,
                level=current_level,
                text=text,
                charCount=len(text),
                blockRange=[start, max(start, end - 1)],
                flags=sec_flags,
            )
        )
        ordinal += 1
        body = []
        flags = []
        start = end

    for i, block in enumerate(blocks):
        if block.type in ("boilerplate", "garbage", "page_artifact"):
            flags.append(block.type)
            continue
        is_heading = block.type == "heading" or (
            len(block.text) <= 120 and (OUTLINE_RE.match(block.text) or block.text.isupper())
        )
        if is_heading and body:
            flush(i)
        if is_heading:
            current_heading = block.text
            current_level = block.level or (1 + block.text.count("."))
            current_path = [block.text]
            start = i
            continue
        body.append(block.text)

    if body or current_heading is not None or not sections:
        flush(len(blocks))
    return sections
