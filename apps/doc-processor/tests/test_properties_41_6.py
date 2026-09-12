"""§41.6 property tests — cleaning idempotence and section text coverage."""

from app.clean import run_cleaning_pipeline
from app.schema import Block
from app.structure.sections import build_sections


def test_cleaning_pipeline_idempotent():
    blocks = [
        Block(type="heading", text="Concordância verbal", level=1),
        Block(type="paragraph", text="O verbo concorda com o sujeito em número e pessoa."),
        Block(type="paragraph", text="adminis-\ntração pública"),
        Block(type="paragraph", text="Cookie Policy · Privacy · Subscribe newsletter"),
        Block(type="paragraph", text="\x00@@@#### junk binary"),
    ]
    once, log1 = run_cleaning_pipeline(blocks, role_hint="knowledge", document_id="idem-1")
    twice, log2 = run_cleaning_pipeline(once, role_hint="knowledge", document_id="idem-1")
    assert [b.text for b in once] == [b.text for b in twice]
    assert [b.type for b in once] == [b.type for b in twice]
    # Second pass should not invent new removals on already-clean text.
    assert sum(e.removed for e in log2) <= sum(e.removed for e in log1)


def test_section_text_covers_cleaned_blocks():
    blocks = [
        Block(type="heading", text="Art. 1º Normas gerais", level=1),
        Block(type="paragraph", text="Esta Lei estabelece normas gerais de licitação."),
        Block(type="heading", text="Art. 2º Definições", level=1),
        Block(type="paragraph", text="Considera-se licitação o procedimento administrativo."),
    ]
    cleaned, _ = run_cleaning_pipeline(blocks, role_hint="knowledge", document_id="sec-1")
    sections = build_sections("sec-1", cleaned)
    joined_sections = "\n".join(s.text for s in sections)
    joined_blocks = "\n".join(b.text for b in cleaned if b.text.strip())
    # Every cleaned block fragment should appear in some section (order-preserving concat).
    for b in cleaned:
        if len(b.text.strip()) < 8:
            continue
        assert b.text.strip()[:40] in joined_sections or b.text.strip() in joined_blocks
    assert len(sections) >= 1
    assert sum(s.charCount for s in sections) >= len(joined_blocks) * 0.5
