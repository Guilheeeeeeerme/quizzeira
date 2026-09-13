"""Ligature / private-use glyph fixes (§13.1)."""

from __future__ import annotations

import re

from app.schema import Block, CleaningLogEntry

_LIGATURES = {
    "\ufb01": "fi",
    "\ufb02": "fl",
    "ﬁ": "fi",
    "ﬂ": "fl",
}
_PRIVATE_USE = re.compile(r"[\ue000-\uf8ff]{2,}")


def fix_ligatures(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    glyph_noise = 0
    out: list[Block] = []
    for block in blocks:
        text = block.text
        for src, dst in _LIGATURES.items():
            if src in text:
                count = text.count(src)
                text = text.replace(src, dst)
                removed += count
        if _PRIVATE_USE.search(text):
            text = _PRIVATE_USE.sub(" ", text)
            glyph_noise += 1
            removed += 1
        out.append(block.model_copy(update={"text": text}))
    sample = f"glyph_noise:{glyph_noise}" if glyph_noise else None
    return out, CleaningLogEntry(step="ligature_fix", removed=removed, sample=sample)
