from app.clean.repeated import reset_domain_shingle_cache, strip_repeated_blocks
from app.schema import Block


def test_repeated_block_removal_after_three_docs():
    reset_domain_shingle_cache()
    shared = Block(type="paragraph", text="Rodapé institucional da banca — todos os direitos reservados 2026.")

    for doc_id in ("d1", "d2", "d3"):
        unique = Block(
            type="paragraph",
            text=f"A concordância verbal exige que o verbo concorde com o sujeito em número ({doc_id}).",
        )
        kept, entry = strip_repeated_blocks(
            [shared, unique],
            domain="example.gov.br",
            document_id=doc_id,
        )
        assert entry.removed == 0
        assert len(kept) == 2

    unique4 = Block(
        type="paragraph",
        text="A concordância verbal exige que o verbo concorde com o sujeito em número (d4).",
    )
    kept4, entry4 = strip_repeated_blocks(
        [shared, unique4],
        domain="example.gov.br",
        document_id="d4",
    )
    assert entry4.step == "repeated_block_removal"
    assert entry4.removed == 1
    assert len(kept4) == 1
    assert "concordância" in kept4[0].text.lower()
