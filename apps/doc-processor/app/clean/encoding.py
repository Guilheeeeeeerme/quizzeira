"""Encoding normalisation (§13.1)."""
from __future__ import annotations

import unicodedata

from ..schema import Block, CleaningLogEntry


def normalize_blocks(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    out: list[Block] = []
    for b in blocks:
        text = unicodedata.normalize("NFC", b.text)
        text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")
        text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
        text = text.replace("–", "-").replace("—", "-")
        try:
            import ftfy  # type: ignore

            fixed = ftfy.fix_text(text)
            if fixed != text:
                removed += 1
                text = fixed
        except Exception:
            pass
        out.append(b.model_copy(update={"text": text}))
    return out, CleaningLogEntry(step="encoding", removed=removed)
