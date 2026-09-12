"""Section building from headings and outline markers (§13.2 text-level part)."""

from __future__ import annotations

import re

from app.schema import Block, Section, Table

_OUTLINE_HEADING = re.compile(r"^(\d+(?:\.\d+)*|[IVXLC]+|[A-Z])[.)\-–]\s+(.+)$")
_ALL_CAPS = re.compile(r"^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ0-9 ,\-–—]{4,120}$")
_LEGAL_ARTICLE = re.compile(
    r"^(?:Art(?:igo)?\.?\s*\d+[ºoª°]?|§\s*\d+[ºoª°]?|Inciso\s+[IVXLC\d]+|Al[ií]nea\s+[a-z]\)?)\b",
    re.I,
)
_LIST_MARKER = re.compile(
    r"^(?:\(?[a-z0-9ivxlc]+\)|[•●▪]|[-–—]|[a-z]\))\s+",
    re.I,
)


def build_sections(
    document_id: str,
    blocks: list[Block],
    tables: list[Table] | None = None,
) -> list[Section]:
    if not blocks:
        return []

    heading_indices = _find_heading_indices(blocks)
    if not heading_indices:
        text = "\n\n".join(b.text for b in blocks if b.type != "page_artifact")
        return [
            Section(
                id=f"{document_id}:0",
                ordinal=0,
                path=[],
                heading=None,
                level=0,
                text=text,
                charCount=len(text),
                blockRange=(0, max(0, len(blocks) - 1)),
                pageRange=_page_range(blocks, 0, len(blocks) - 1),
                flags=[],
            )
        ]

    sections: list[Section] = []
    path_stack: list[tuple[int, str]] = []

    for idx, h_idx in enumerate(heading_indices):
        end_idx = (heading_indices[idx + 1] - 1) if idx + 1 < len(heading_indices) else len(blocks) - 1
        heading_block = blocks[h_idx]
        level = heading_block.level or _infer_heading_level(heading_block.text)
        heading_text = heading_block.text.strip()

        while path_stack and path_stack[-1][0] >= level:
            path_stack.pop()
        path_stack.append((level, heading_text))
        path = [p[1] for p in path_stack]

        body_blocks = [
            b
            for b in blocks[h_idx + 1 : end_idx + 1]
            if b.type not in ("page_artifact", "heading") and b.text.strip()
        ]
        body_text = "\n\n".join(b.text for b in body_blocks)
        if tables:
            body_text = _append_table_markdown(body_text, tables)
        body_text, _list_removed = normalise_list_markers(body_text)

        full_text = f"{heading_text}\n\n{body_text}".strip() if body_text else heading_text
        flags: list[str] = []
        if _LEGAL_ARTICLE.match(heading_text):
            flags.append("legal_article")

        sections.append(
            Section(
                id=f"{document_id}:{len(sections)}",
                ordinal=len(sections),
                path=path[:-1],
                heading=heading_text,
                level=level,
                text=full_text,
                charCount=len(full_text),
                blockRange=(h_idx, end_idx),
                pageRange=_page_range(blocks, h_idx, end_idx),
                flags=flags,
            )
        )

    return sections


def _find_heading_indices(blocks: list[Block]) -> list[int]:
    indices: list[int] = []
    for i, block in enumerate(blocks):
        if block.type == "heading":
            indices.append(i)
            continue
        text = block.text.strip()
        if _LEGAL_ARTICLE.match(text):
            indices.append(i)
            continue
        if _OUTLINE_HEADING.match(text) or (_ALL_CAPS.match(text) and len(text.split()) >= 2):
            indices.append(i)
    return indices


def _infer_heading_level(text: str) -> int:
    outline = _OUTLINE_HEADING.match(text.strip())
    if outline:
        marker = outline.group(1)
        if marker.isdigit() or "." in marker:
            return marker.count(".") + 1
        if re.match(r"^[IVXLC]+$", marker):
            return 1
        return 2
    if _ALL_CAPS.match(text.strip()):
        return 1
    return 2


def _page_range(blocks: list[Block], start: int, end: int) -> tuple[int, int] | None:
    pages = [b.page for b in blocks[start : end + 1] if b.page is not None]
    if not pages:
        return None
    return min(pages), max(pages)


def _append_table_markdown(text: str, tables: list[Table]) -> str:
    if not tables:
        return text
    parts = [text] if text else []
    for table in tables:
        if table.markdown:
            parts.append(table.markdown)
    return "\n\n".join(parts)


def normalise_list_markers(text: str) -> tuple[str, int]:
    """Strip a)/•/I – markers into plain list lines; returns (text, removed_count)."""
    removed = 0
    lines: list[str] = []
    for line in text.splitlines():
        m = _LIST_MARKER.match(line.strip())
        if m:
            removed += 1
            lines.append(line.strip()[m.end() :])
        else:
            lines.append(line)
    return "\n".join(lines), removed
