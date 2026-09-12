from __future__ import annotations

import re

from ..schema import Block, CleaningLogEntry

ALPHA_RE = re.compile(r"[A-Za-zÀ-ÿ]")


def flag_garbage(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    out = []
    for b in blocks:
        text = b.text.strip()
        if not text:
            out.append(b)
            continue
        alpha = len(ALPHA_RE.findall(text))
        ratio = alpha / max(1, len(text))
        words = text.split()
        avg_len = sum(len(w) for w in words) / max(1, len(words))
        if ratio < 0.6 or avg_len > 14:
            out.append(b.model_copy(update={"type": "garbage"}))
            removed += 1
        else:
            out.append(b)
    return out, CleaningLogEntry(step="garbage", removed=removed)
