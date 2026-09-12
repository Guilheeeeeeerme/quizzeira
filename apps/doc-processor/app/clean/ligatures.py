from __future__ import annotations

from ..schema import Block, CleaningLogEntry

MAP = {"ﬁ": "fi", "ﬂ": "fl", "ﬀ": "ff", "ﬃ": "ffi", "ﬄ": "ffl"}


def fix_ligatures(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    out = []
    for b in blocks:
        text = b.text
        for src, dst in MAP.items():
            if src in text:
                removed += text.count(src)
                text = text.replace(src, dst)
        out.append(b.model_copy(update={"text": text}))
    return out, CleaningLogEntry(step="ligatures", removed=removed)
