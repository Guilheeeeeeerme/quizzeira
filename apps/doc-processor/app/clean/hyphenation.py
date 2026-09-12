"""Hyphenation repair across line breaks (§13.1)."""

from __future__ import annotations

import re

from app.schema import Block, CleaningLogEntry

_HYPHEN_BREAK = re.compile(r"(\w+)-\s*\n\s*(\w+)", re.UNICODE)
_HYPHEN_SOFT = re.compile(r"(\w+)-\s+(\w+)", re.UNICODE)


def repair_hyphenation(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    corpus = " ".join(b.text for b in blocks).lower()
    removed = 0
    out: list[Block] = []

    def join_match(left: str, right: str, original: str) -> str:
        nonlocal removed
        joined = f"{left}{right}"
        if right[:1].islower() or joined.lower() in corpus:
            removed += 1
            return joined
        return original

    for block in blocks:
        text = block.text

        def repl_break(match: re.Match[str]) -> str:
            return join_match(match.group(1), match.group(2), match.group(0))

        text = _HYPHEN_BREAK.sub(repl_break, text)

        def repl_soft(match: re.Match[str]) -> str:
            return join_match(match.group(1), match.group(2), match.group(0))

        text = _HYPHEN_SOFT.sub(repl_soft, text)
        out.append(block.model_copy(update={"text": text}))

    return out, CleaningLogEntry(step="hyphenation_repair", removed=removed)
