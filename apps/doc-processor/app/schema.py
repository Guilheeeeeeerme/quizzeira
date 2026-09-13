"""Pydantic models matching packages/shared NormalizedDocument schemaVersion \"1\"."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

SCHEMA_VERSION = "1"

BlockType = Literal[
    "heading",
    "paragraph",
    "list_item",
    "table",
    "caption",
    "footnote",
    "page_artifact",
]

SectionFlag = Literal[
    "boilerplate",
    "garbage",
    "non_pt",
    "table_only",
    "legal_article",
]

ExtractorEngine = Literal[
    "pymupdf",
    "docling",
    "trafilatura",
    "python-docx",
    "libreoffice+docling",
    "ebooklib",
    "plain",
]


class FontStats(BaseModel):
    size: float | None = None
    bold: bool | None = None


class Block(BaseModel):
    type: BlockType
    text: str
    level: int | None = None
    page: int | None = None
    bbox: tuple[float, float, float, float] | None = None
    fontStats: FontStats | None = None


class Section(BaseModel):
    id: str
    ordinal: int
    path: list[str]
    heading: str | None
    level: int
    text: str
    charCount: int
    blockRange: tuple[int, int]
    pageRange: tuple[int, int] | None = None
    flags: list[SectionFlag] = Field(default_factory=list)


class Table(BaseModel):
    id: str
    page: int | None = None
    rows: list[list[str]]
    markdown: str


class CleaningLogEntry(BaseModel):
    step: str
    removed: int
    sample: str | None = None


class SourceInfo(BaseModel):
    url: str | None
    contentType: str
    byteSize: int
    fetchedAt: str


class ExtractorInfo(BaseModel):
    engine: ExtractorEngine
    version: str
    options: dict[str, Any] = Field(default_factory=dict)


class Stats(BaseModel):
    pages: int | None
    chars: int
    textLayerRatio: float | None
    ocrConfidence: float | None
    language: str
    blocksByType: dict[str, int]
    linkDensity: float


class Metadata(BaseModel):
    title: str | None = None
    author: str | None = None
    date: str | None = None
    sitename: str | None = None


class NormalizedDocument(BaseModel):
    schemaVersion: Literal["1"] = SCHEMA_VERSION
    documentId: str
    contentHash: str
    source: SourceInfo
    extractor: ExtractorInfo
    stats: Stats
    metadata: Metadata
    blocks: list[Block]
    sections: list[Section]
    tables: list[Table]
    cleaningLog: list[CleaningLogEntry] = Field(default_factory=list)


class ProcessOptions(BaseModel):
    ocr: Literal["auto", "force", "off"] = "auto"
    maxPages: int | None = None


class ProcessJsonRequest(BaseModel):
    documentId: str
    contentType: str
    base64: str | None = None
    bytesBase64: str | None = None
    url: str | None = None
    roleHint: str | None = None
    kindHint: str | None = None
    storageKey: str | None = None
    options: ProcessOptions | None = None
