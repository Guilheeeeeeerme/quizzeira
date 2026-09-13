from app.clean.boilerplate import strip_boilerplate_blocks
from app.clean.hyphenation import repair_hyphenation
from app.clean.ligatures import fix_ligatures
from app.clean.garbage import drop_garbage_blocks
from app.clean.minimum import enforce_minimum_content
from app.schema import Block


def test_hyphenation_joins_lowercase_continuation():
    blocks = [Block(type="paragraph", text="adminis-\ntração pública")]
    out, log = repair_hyphenation(blocks)
    assert "administração" in out[0].text or "administracao" in out[0].text.replace("ç", "c")
    assert log.removed >= 1


def test_ligature_fi():
    blocks = [Block(type="paragraph", text="ﬁnalidade")]
    out, log = fix_ligatures(blocks)
    assert out[0].text.startswith("fi")
    assert log.removed >= 1


def test_garbage_drops_binary_noise():
    blocks = [
        Block(type="paragraph", text="Concordância verbal é a regra."),
        Block(type="paragraph", text="\x00\x01\x02@@@####$$$$%%%%"),
    ]
    out, log = drop_garbage_blocks(blocks)
    assert len(out) == 1
    assert log.removed == 1


def test_minimum_content_skips_evidence():
    blocks = [Block(type="paragraph", text="1-A 2-B 3-C")]
    out, log = enforce_minimum_content(blocks, role_hint="evidence")
    assert len(out) == 1
    assert log.sample == "skipped_evidence"


def test_link_density_boilerplate():
    blocks = [
        Block(
            type="paragraph",
            text="https://spam.example/promo https://spam.example/buy click",
        ),
        Block(
            type="paragraph",
            text="A concordância verbal estabelece que o verbo deve concordar com o sujeito.",
        ),
    ]
    out, log = strip_boilerplate_blocks(blocks)
    assert log.removed == 1
    assert len(out) == 1
    assert "concordância" in out[0].text.lower()
