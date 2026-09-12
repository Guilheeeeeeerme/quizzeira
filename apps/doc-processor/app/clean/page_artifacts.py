"""Page artifact and page-number pattern removal."""

from __future__ import annotations

import re
from collections import Counter

from app.schema import Block, CleaningLogEntry

_PAGE_NUMBER = re.compile(r"^\s*(P[aá]gina\s+)?\d+(\s*/\s*\d+)?\s*$", re.IGNORECASE)


def remove_page_number_patterns(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    sample: str | None = None
    kept: list[Block] = []

    for block in blocks:
        if _PAGE_NUMBER.match(block.text):
            removed += 1
            if sample is None:
                sample = block.text[:80]
            kept.append(block.model_copy(update={"type": "page_artifact"}))
        else:
            kept.append(block)

    return kept, CleaningLogEntry(step="page_number_removal", removed=removed, sample=sample)


def remove_page_artifacts(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    """Mark repeated short lines appearing on many pages as page_artifact."""
    if not blocks:
        return blocks, CleaningLogEntry(step="page_artifact_removal", removed=0)

    pages = {b.page for b in blocks if b.page is not None}
    page_count = len(pages) if pages else 0
    if page_count < 3:
        return blocks, CleaningLogEntry(step="page_artifact_removal", removed=0)

    threshold = max(2, int(page_count * 0.6))
    text_page_hits: Counter[str] = Counter()

    for block in blocks:
        norm = block.text.strip().lower()
        if len(norm) < 80 and block.page is not None:
            text_page_hits[norm] += 1

    repeated = {text for text, count in text_page_hits.items() if count >= threshold}
    removed = 0
    sample: str | None = None
    result: list[Block] = []

    for block in blocks:
        norm = block.text.strip().lower()
        if norm in repeated and block.type != "heading":
            removed += 1
            if sample is None:
                sample = block.text[:80]
            result.append(block.model_copy(update={"type": "page_artifact"}))
        else:
            result.append(block)

    return result, CleaningLogEntry(step="page_artifact_removal", removed=removed, sample=sample)
