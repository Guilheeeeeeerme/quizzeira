from __future__ import annotations

import re

from ..schema import Block, CleaningLogEntry

HYPHEN_RE = re.compile(r"(\w+)-\n(\w+)")


def repair_hyphenation(blocks: list[Block]) -> tuple[list[Block], CleaningLogEntry]:
    removed = 0
    corpus = " ".join(b.text for b in blocks).lower()
    out = []
    for b in blocks:
        def repl(m: re.Match[str]) -> str:
            nonlocal removed
            joined = m.group(1) + m.group(2)
            if joined.lower() in corpus or m.group(2)[:1].islower():
                removed += 1
                return joined
            return m.group(0)

        text = HYPHEN_RE.sub(repl, b.text)
        out.append(b.model_copy(update={"text": text}))
    return out, CleaningLogEntry(step="hyphenation", removed=removed)
