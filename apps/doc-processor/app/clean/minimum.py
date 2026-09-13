"""Minimum content gate (§13.1)."""

from __future__ import annotations

from app.schema import Block, CleaningLogEntry


def enforce_minimum_content(
    blocks: list[Block],
    *,
    role_hint: str | None = None,
    min_chars: int = 400,
) -> tuple[list[Block], CleaningLogEntry]:
    total = sum(len(b.text.strip()) for b in blocks)
    if role_hint == "evidence":
        return blocks, CleaningLogEntry(step="minimum_content", removed=0, sample="skipped_evidence")
    if total < min_chars:
        return [], CleaningLogEntry(
            step="minimum_content",
            removed=len(blocks),
            sample=f"too_short:{total}",
        )
    return blocks, CleaningLogEntry(step="minimum_content", removed=0, sample=f"chars:{total}")
