import re
from dataclasses import dataclass


BOX_PATTERN = re.compile(r"<box><(\d+)><(\d+)><(\d+)><(\d+)></box>")
SEMANTIC_PATTERN = re.compile(r"<semantic>([^<]+)</semantic>")


@dataclass
class ParsedBox:
    label: str
    x1: float
    y1: float
    x2: float
    y2: float


def _normalize_coord(value: int, axis_size: int) -> float:
    return value / 1000.0 * axis_size


def parse_boxes(answer: str, image_width: int, image_height: int) -> list[ParsedBox]:
    """Parse LocateAnything model output into pixel-coordinate boxes."""
    labels = SEMANTIC_PATTERN.findall(answer)
    boxes: list[ParsedBox] = []

    for index, match in enumerate(BOX_PATTERN.finditer(answer)):
        x1, y1, x2, y2 = (int(group) for group in match.groups())
        label = labels[index].strip() if index < len(labels) else "object"
        boxes.append(
            ParsedBox(
                label=label,
                x1=_normalize_coord(x1, image_width),
                y1=_normalize_coord(y1, image_height),
                x2=_normalize_coord(x2, image_width),
                y2=_normalize_coord(y2, image_height),
            )
        )

    return boxes


def dedupe_boxes(boxes: list[ParsedBox], iou_threshold: float = 0.7) -> list[ParsedBox]:
    """Remove near-duplicate boxes, keeping the one with the longer label."""
    kept: list[ParsedBox] = []

    for candidate in boxes:
        duplicate = False
        for index, existing in enumerate(kept):
            if _iou(candidate, existing) >= iou_threshold:
                duplicate = True
                if len(candidate.label) > len(existing.label):
                    kept[index] = candidate
                break
        if not duplicate:
            kept.append(candidate)

    return kept


def _iou(a: ParsedBox, b: ParsedBox) -> float:
    x_left = max(a.x1, b.x1)
    y_top = max(a.y1, b.y1)
    x_right = min(a.x2, b.x2)
    y_bottom = min(a.y2, b.y2)

    if x_right <= x_left or y_bottom <= y_top:
        return 0.0

    intersection = (x_right - x_left) * (y_bottom - y_top)
    area_a = max(0.0, (a.x2 - a.x1)) * max(0.0, (a.y2 - a.y1))
    area_b = max(0.0, (b.x2 - b.x1)) * max(0.0, (b.y2 - b.y1))
    union = area_a + area_b - intersection
    return intersection / union if union > 0 else 0.0
