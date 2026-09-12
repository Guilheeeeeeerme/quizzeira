"""Format-specific extractors."""

from app.extract.html import extract_html
from app.extract.office import extract_docx as extract_office
from app.extract.pdf import extract_pdf
from app.extract.plain import extract_plain

__all__ = ["extract_html", "extract_office", "extract_pdf", "extract_plain"]
