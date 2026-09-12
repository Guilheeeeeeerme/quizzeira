from __future__ import annotations

from ..schema import Block, CleaningLogEntry


def drop_empty(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    out = [b for b in blocks if b.text.strip()]
    return out, CleaningLogEntry(step="minimum", removed=len(blocks) - len(out))
