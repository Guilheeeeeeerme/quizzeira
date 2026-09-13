"""§13.1 minimum_content gate — short docs fail closed."""

from app.clean.minimum import enforce_minimum_content
from app.schema import Block


def test_minimum_content_wipes_short_knowledge():
    blocks = [Block(type="paragraph", text="texto curto de exemplo para teste")]
    kept, entry = enforce_minimum_content(blocks, role_hint="knowledge", min_chars=400)
    assert kept == []
    assert entry.step == "minimum_content"
    assert entry.sample and entry.sample.startswith("too_short:")


def test_minimum_content_skips_evidence():
    blocks = [Block(type="paragraph", text="1 A  2 B  3 C")]
    kept, entry = enforce_minimum_content(blocks, role_hint="evidence", min_chars=400)
    assert kept == blocks
    assert entry.sample == "skipped_evidence"
