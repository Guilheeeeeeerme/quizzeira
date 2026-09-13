"""Garbage block detection (§13.1)."""

from __future__ import annotations

import re

from app.schema import Block, CleaningLogEntry

_WORD = re.compile(r"[A-Za-zÀ-ÿ]{2,}")


def _is_garbage(text: str) -> bool:
    stripped = text.strip()
    if len(stripped) < 8:
        return False
    alpha = sum(1 for c in stripped if c.isalpha())
    if alpha / max(1, len(stripped)) < 0.6:
        return True
    words = _WORD.findall(stripped)
    if not words:
        return True
    avg = sum(len(w) for w in words) / len(words)
    if avg > 14:
        return True
    return False


def drop_garbage_blocks(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    kept: list[Block] = []
    removed = 0
    for block in blocks:
        if _is_garbage(block.text):
            removed += 1
            continue
        kept.append(block)
    return kept, CleaningLogEntry(step="garbage_detection", removed=removed)
