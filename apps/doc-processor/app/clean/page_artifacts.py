from __future__ import annotations

import re
from collections import Counter

from ..schema import Block, CleaningLogEntry

PAGE_NUM_RE = re.compile(r"^\s*(P[áa]gina\s+)?\d+(\s*/\s*\d+)?\s*$", re.I)


def flag_page_artifacts(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    pages = {b.page for b in blocks if b.page is not None}
    page_count = max(1, len(pages))
    counts = Counter(b.text.strip().lower() for b in blocks if b.text.strip())
    removed = 0
    out = []
    for b in blocks:
        key = b.text.strip().lower()
        if PAGE_NUM_RE.match(b.text) or (counts[key] >= max(2, int(0.6 * page_count)) and len(key) < 80):
            out.append(b.model_copy(update={"type": "page_artifact"}))
            removed += 1
        else:
            out.append(b)
    return out, CleaningLogEntry(step="page_artifacts", removed=removed)
