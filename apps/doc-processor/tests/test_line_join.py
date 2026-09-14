"""Wrapped lines join with a space; hyphenations are removed; heading lines stay separate."""

from app.layout.columns import join_lines_to_paragraphs
from app.layout.columns import RawBlock


def _line(text: str, y: float, size: float = 10.0, bold: bool = False) -> RawBlock:
    return RawBlock(text=text, x0=50, y0=y, x1=500, y1=y + 11, page=1, font_size=size, bold=bold)


def test_wrapped_lines_join_with_space_and_dehyphenate():
    blocks = [
        _line("LÍNGUA PORTUGUESA", 100),
        _line("Leitura, compreensão e interpretação de textos verbais; informações explícitas e", 113),
        _line("informações implícitas; sinonímia e anto-", 126),
        _line("nímia; ambiguidade.", 139),
        _line("RACIOCÍNIO LÓGICO, ESTATÍSTICA E ANÁLISE DE DADOS", 152),
        _line("Estruturas lógicas; proposições.", 165),
    ]
    merged = [b.text for b in join_lines_to_paragraphs(blocks)]
    assert merged == [
        "LÍNGUA PORTUGUESA",
        "Leitura, compreensão e interpretação de textos verbais; informações explícitas e informações implícitas; sinonímia e antonímia; ambiguidade.",
        "RACIOCÍNIO LÓGICO, ESTATÍSTICA E ANÁLISE DE DADOS",
        "Estruturas lógicas; proposições.",
    ]
