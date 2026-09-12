from app.structure.sections import build_sections, normalise_list_markers
from app.schema import Block


def test_list_marker_normalisation():
    text, removed = normalise_list_markers("a) primeiro\n• segundo\nI – terceiro")
    assert removed == 3
    assert "primeiro" in text
    assert "a)" not in text


def test_legal_article_flag():
    blocks = [
        Block(type="paragraph", text="Art. 1º Esta Lei estabelece normas gerais."),
        Block(type="paragraph", text="Parágrafo único. Aplica-se à Administração."),
        Block(type="paragraph", text="Art. 2º Considera-se licitação o procedimento."),
    ]
    sections = build_sections("doc-1", blocks)
    assert len(sections) >= 2
    assert any("legal_article" in s.flags for s in sections)
