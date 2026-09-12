"""Plain text and Markdown extraction."""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.schema import Block, ExtractorInfo, Metadata, Table


@dataclass
class PlainExtractResult:
    blocks: list[Block]
    tables: list[Table]
    metadata: Metadata
    extractor: ExtractorInfo


_MD_HEADING = re.compile(r"^(#{1,6})\s+(.+)$")
_OUTLINE_HEADING = re.compile(r"^(\d+(?:\.\d+)*|[IVXLC]+|[A-Z])[.)\-–]\s+\S")


def extract_plain(data: bytes, content_type: str) -> PlainExtractResult:
    text = data.decode("utf-8", errors="replace")
    blocks: list[Block] = []

    for line in text.splitlines():
        stripped = line.strip()
        if not stripped:
            continue

        md = _MD_HEADING.match(stripped)
        if md:
            level = len(md.group(1))
            blocks.append(Block(type="heading", text=md.group(2).strip(), level=level))
            continue

        if _OUTLINE_HEADING.match(stripped) and len(stripped) <= 120:
            blocks.append(Block(type="heading", text=stripped, level=_outline_level(stripped)))
            continue

        if stripped.isupper() and 4 <= len(stripped) <= 120 and stripped.replace(" ", "").isalpha():
            blocks.append(Block(type="heading", text=stripped, level=1))
            continue

        blocks.append(Block(type="paragraph", text=stripped))

    return PlainExtractResult(
        blocks=blocks,
        tables=[],
        metadata=Metadata(title=None, author=None, date=None, sitename=None),
        extractor=ExtractorInfo(
            engine="plain",
            version="1",
            options={"contentType": content_type},
        ),
    )


def _outline_level(line: str) -> int:
    match = re.match(r"^(\d+(?:\.\d+)*)", line)
    if match:
        return match.group(1).count(".") + 1
    if re.match(r"^[IVXLC]+[.)\-–]", line):
        return 1
    return 2
