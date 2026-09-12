from __future__ import annotations

import re

from ..schema import Block, CleaningLogEntry

LINK_RE = re.compile(r"https?://|www\.")


def flag_boilerplate(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    out = []
    for b in blocks:
        text = b.text
        link_chars = sum(len(m.group(0)) for m in LINK_RE.finditer(text))
        density = link_chars / max(1, len(text))
        if density > 0.5 and len(text) < 200:
            out.append(b.model_copy(update={"type": "boilerplate"}))
            removed += 1
        else:
            out.append(b)
    return out, CleaningLogEntry(step="boilerplate", removed=removed)
