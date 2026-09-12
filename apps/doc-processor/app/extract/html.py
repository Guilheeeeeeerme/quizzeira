"""HTML extraction: trafilatura when available, else BeautifulSoup/lxml."""

from __future__ import annotations

from dataclasses import dataclass

from app.schema import Block, ExtractorInfo, Metadata, Table


@dataclass
class HtmlExtractResult:
    blocks: list[Block]
    tables: list[Table]
    metadata: Metadata
    extractor: ExtractorInfo
    link_density: float


def _trafilatura_available() -> bool:
    try:
        import trafilatura  # noqa: F401

        return True
    except ImportError:
        return False


def extract_html(data: bytes, url: str | None = None) -> HtmlExtractResult:
    html = data.decode("utf-8", errors="replace")
    if _trafilatura_available():
        return _extract_trafilatura(html, url)
    return _extract_beautifulsoup(html, url)


def _extract_trafilatura(html: str, url: str | None) -> HtmlExtractResult:
    import trafilatura

    result = trafilatura.bare_extraction(
        html,
        url=url,
        favor_precision=True,
        include_tables=True,
        with_metadata=True,
    )
    if not result or not result.get("text"):
        result = trafilatura.bare_extraction(
            html,
            url=url,
            favor_recall=True,
            include_tables=True,
            with_metadata=True,
        )

    text = (result or {}).get("text") or ""
    metadata = Metadata(
        title=(result or {}).get("title"),
        author=(result or {}).get("author"),
        date=(result or {}).get("date"),
        sitename=(result or {}).get("sitename"),
    )
    blocks = _text_and_headings_to_blocks(text, html)
    tables = _extract_tables_from_html(html)
    link_density = _estimate_link_density(html)

    return HtmlExtractResult(
        blocks=blocks,
        tables=tables,
        metadata=metadata,
        extractor=ExtractorInfo(
            engine="trafilatura",
            version=getattr(trafilatura, "__version__", "unknown"),
            options={"url": url} if url else {},
        ),
        link_density=link_density,
    )


def _extract_beautifulsoup(html: str, url: str | None) -> HtmlExtractResult:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "lxml")
    for tag in soup.find_all(["script", "style", "nav", "header", "footer", "aside", "form"]):
        tag.decompose()

    for selector in [
        "[role=navigation]",
        ".cookie",
        ".breadcrumb",
        ".share",
        ".related",
    ]:
        for node in soup.select(selector):
            node.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else None
    blocks: list[Block] = []

    for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        level = int(heading.name[1])
        text = heading.get_text(" ", strip=True)
        if text:
            blocks.append(Block(type="heading", text=text, level=level))

    body = soup.find("body") or soup
    for element in body.find_all(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"]):
        text = element.get_text(" ", strip=True)
        if not text:
            continue
        if element.name.startswith("h"):
            continue
        block_type = "list_item" if element.name == "li" else "paragraph"
        blocks.append(Block(type=block_type, text=text))

    if not blocks:
        text = body.get_text("\n", strip=True)
        blocks = _text_to_paragraph_blocks(text)

    tables = _extract_tables_from_soup(soup)
    link_density = _estimate_link_density(html)

    return HtmlExtractResult(
        blocks=blocks,
        tables=tables,
        metadata=Metadata(title=title, author=None, date=None, sitename=None),
        extractor=ExtractorInfo(
            engine="trafilatura",
            version="beautifulsoup-fallback",
            options={"url": url, "fallback": True} if url else {"fallback": True},
        ),
        link_density=link_density,
    )


def _text_and_headings_to_blocks(text: str, html: str) -> list[Block]:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "lxml")
    blocks: list[Block] = []
    for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        ht = heading.get_text(" ", strip=True)
        if ht:
            blocks.append(Block(type="heading", text=ht, level=int(heading.name[1])))

    if blocks:
        para_blocks = _text_to_paragraph_blocks(text)
        existing = {b.text for b in blocks}
        for pb in para_blocks:
            if pb.text not in existing:
                blocks.append(pb)
        return blocks

    return _text_to_paragraph_blocks(text)


def _text_to_paragraph_blocks(text: str) -> list[Block]:
    blocks: list[Block] = []
    for para in text.split("\n"):
        stripped = para.strip()
        if stripped:
            blocks.append(Block(type="paragraph", text=stripped))
    return blocks


def _extract_tables_from_html(html: str) -> list[Table]:
    from bs4 import BeautifulSoup

    return _extract_tables_from_soup(BeautifulSoup(html, "lxml"))


def _extract_tables_from_soup(soup) -> list[Table]:
    tables: list[Table] = []
    for idx, table in enumerate(soup.find_all("table")):
        rows: list[list[str]] = []
        for tr in table.find_all("tr"):
            cells = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
            if cells:
                rows.append(cells)
        if not rows:
            continue
        markdown = _table_to_markdown(rows)
        tables.append(Table(id=f"table-{idx + 1}", rows=rows, markdown=markdown))
    return tables


def _table_to_markdown(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    width = max(len(r) for r in rows)
    normalized = [r + [""] * (width - len(r)) for r in rows]
    header = normalized[0]
    sep = ["---"] * width
    body = normalized[1:] if len(normalized) > 1 else []
    lines = [
        "| " + " | ".join(header) + " |",
        "| " + " | ".join(sep) + " |",
    ]
    for row in body:
        lines.append("| " + " | ".join(row) + " |")
    return "\n".join(lines)


def _estimate_link_density(html: str) -> float:
    from bs4 import BeautifulSoup

    soup = BeautifulSoup(html, "lxml")
    text = soup.get_text(" ", strip=True)
    if not text:
        return 0.0
    link_text_len = sum(len(a.get_text(strip=True)) for a in soup.find_all("a"))
    return min(1.0, link_text_len / len(text))
