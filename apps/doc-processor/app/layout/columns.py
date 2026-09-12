"""Two-column reading-order recovery (§12.3)."""
from __future__ import annotations

from typing import Any


def order_blocks_reading_order(blocks: list[dict[str, Any]], page_width: float) -> list[dict[str, Any]]:
    if len(blocks) < 4 or page_width <= 0:
        return sorted(blocks, key=lambda b: (_y(b), _x(b)))

    centres = []
    for b in blocks:
        bbox = b.get("bbox")
        if not bbox or len(bbox) < 4:
            continue
        centres.append((bbox[0] + bbox[2]) / 2)

    if len(centres) < 4:
        return sorted(blocks, key=lambda b: (_y(b), _x(b)))

    mid = page_width / 2
    left = [c for c in centres if c < mid - page_width * 0.05]
    right = [c for c in centres if c > mid + page_width * 0.05]
    if len(left) + len(right) < 0.7 * len(centres) or not left or not right:
        return sorted(blocks, key=lambda b: (_y(b), _x(b)))

    left_blocks = []
    right_blocks = []
    other = []
    for b in blocks:
        bbox = b.get("bbox")
        if not bbox:
            other.append(b)
            continue
        cx = (bbox[0] + bbox[2]) / 2
        if cx < mid:
            left_blocks.append(b)
        else:
            right_blocks.append(b)
    left_blocks.sort(key=lambda b: _y(b))
    right_blocks.sort(key=lambda b: _y(b))
    return left_blocks + right_blocks + other


def _y(b: dict[str, Any]) -> float:
    bbox = b.get("bbox")
    return float(bbox[1]) if bbox and len(bbox) > 1 else 0.0


def _x(b: dict[str, Any]) -> float:
    bbox = b.get("bbox")
    return float(bbox[0]) if bbox and len(bbox) > 0 else 0.0
