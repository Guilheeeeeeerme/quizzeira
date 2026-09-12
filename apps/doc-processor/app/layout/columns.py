"""Two-column reading-order recovery for PDF blocks (§12.3)."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class RawBlock:
    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    page: int
    font_size: float | None = None
    bold: bool = False
    block_type: str = "paragraph"
    level: int | None = None


def _x_center(block: RawBlock) -> float:
    return (block.x0 + block.x1) / 2.0


def _detect_two_column_centers(blocks: list[RawBlock], page_width: float) -> tuple[float, float] | None:
    if len(blocks) < 4 or page_width <= 0:
        return None

    centers = [_x_center(b) for b in blocks]
    mid = page_width / 2.0
    left = [c for c in centers if c < mid - 10]
    right = [c for c in centers if c > mid + 10]

    if not left or not right:
        return None

    left_mode = sum(left) / len(left)
    right_mode = sum(right) / len(right)
    in_modes = sum(1 for c in centers if abs(c - left_mode) < 40 or abs(c - right_mode) < 40)
    if in_modes / len(centers) < 0.7:
        return None

    valley = mid
    if abs(left_mode - valley) < 30 or abs(right_mode - valley) < 30:
        return None

    return left_mode, right_mode


def order_blocks_in_reading_order(
    blocks: list[RawBlock],
    page_width: float,
) -> list[RawBlock]:
    """Sort blocks by column heuristic or single-column (y, x) order."""
    if not blocks:
        return []

    centers = _detect_two_column_centers(blocks, page_width)
    if centers is None:
        return sorted(blocks, key=lambda b: (b.page, b.y0, b.x0))

    left_mode, right_mode = centers
    left_col: list[RawBlock] = []
    right_col: list[RawBlock] = []

    for block in blocks:
        cx = _x_center(block)
        if abs(cx - left_mode) <= abs(cx - right_mode):
            left_col.append(block)
        else:
            right_col.append(block)

    left_col.sort(key=lambda b: (b.page, b.y0, b.x0))
    right_col.sort(key=lambda b: (b.page, b.y0, b.x0))
    return left_col + right_col


def join_lines_to_paragraphs(blocks: list[RawBlock], median_line_height: float | None = None) -> list[RawBlock]:
    """Merge consecutive lines into paragraphs when vertical gap is small."""
    if not blocks:
        return []

    if median_line_height is None:
        heights = [max(1.0, b.y1 - b.y0) for b in blocks]
        median_line_height = sorted(heights)[len(heights) // 2] if heights else 12.0

    gap_threshold = 1.4 * median_line_height
    merged: list[RawBlock] = []
    current: RawBlock | None = None

    for block in blocks:
        if current is None:
            current = block
            continue

        same_page = block.page == current.page
        gap = block.y0 - current.y1
        hyphen_break = current.text.rstrip().endswith("-") and block.text[:1].islower()

        if same_page and 0 <= gap < gap_threshold and not hyphen_break:
            join_text = current.text.rstrip("-") + block.text.lstrip()
            current = RawBlock(
                text=join_text,
                x0=min(current.x0, block.x0),
                y0=current.y0,
                x1=max(current.x1, block.x1),
                y1=block.y1,
                page=current.page,
                font_size=current.font_size or block.font_size,
                bold=current.bold or block.bold,
                block_type=current.block_type,
                level=current.level,
            )
        else:
            merged.append(current)
            current = block

    if current is not None:
        merged.append(current)

    return merged
