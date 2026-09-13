"""Whitespace collapse while preserving paragraph boundaries."""

from __future__ import annotations

import re

from app.schema import Block, CleaningLogEntry

_MULTI_SPACE = re.compile(r"[ \t]+")
_MULTI_NEWLINE = re.compile(r"\n{3,}")


def collapse_whitespace(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    sample: str | None = None
    cleaned: list[Block] = []

    for block in blocks:
        original = block.text
        text = original.replace("\r\n", "\n").replace("\r", "\n")
        text = _MULTI_NEWLINE.sub("\n\n", text)
        lines = [_MULTI_SPACE.sub(" ", line).strip() for line in text.split("\n")]
        text = "\n".join(line for line in lines if line)

        if text != original:
            removed += len(original) - len(text)
            if sample is None:
                sample = original[:80]

        if text:
            cleaned.append(block.model_copy(update={"text": text}))

    return cleaned, CleaningLogEntry(step="whitespace_collapse", removed=max(0, removed), sample=sample)
