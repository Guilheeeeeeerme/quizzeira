"""Pydantic NormalizedDocument contract (§29.3)."""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class Block(BaseModel):
    type: Literal[
        "heading",
        "paragraph",
        "list_item",
        "table",
        "caption",
        "footnote",
        "page_artifact",
        "boilerplate",
        "garbage",
    ]
    text: str
    level: Optional[int] = None
    page: Optional[int] = None
    bbox: Optional[list[float]] = None
    fontStats: Optional[dict[str, Any]] = None


class Section(BaseModel):
    id: str
    ordinal: int
    path: list[str]
    heading: Optional[str] = None
    level: int = 1
    text: str
    charCount: int
    blockRange: list[int]
    pageRange: Optional[list[int]] = None
    flags: list[str] = Field(default_factory=list)


class Table(BaseModel):
    id: str
    page: Optional[int] = None
    headers: list[str] = Field(default_factory=list)
    rows: list[list[str]] = Field(default_factory=list)
    markdown: str = ""


class CleaningLogEntry(BaseModel):
    step: str
    removed: int
    sample: Optional[str] = None


class NormalizedDocument(BaseModel):
    schemaVersion: Literal["1"] = "1"
    documentId: str
    contentHash: str
    source: dict[str, Any]
    extractor: dict[str, Any]
    stats: dict[str, Any]
    metadata: dict[str, Any]
    blocks: list[Block]
    sections: list[Section]
    tables: list[Table]
    cleaningLog: list[CleaningLogEntry] = Field(default_factory=list)
