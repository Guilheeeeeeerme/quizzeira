from __future__ import annotations

import re

from ..schema import Block, CleaningLogEntry


def normalize_whitespace(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    out = []
    for b in blocks:
        text = re.sub(r"[ \t]+", " ", b.text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        if text != b.text:
            removed += 1
        out.append(b.model_copy(update={"text": text}))
    return out, CleaningLogEntry(step="whitespace", removed=removed)
