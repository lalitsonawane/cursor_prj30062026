import { iou } from "./coordinates";
import type { Detection } from "./types";

const IOU_THRESHOLD = 0.45;

function makeId(label: string, box: Pick<Detection, "x1" | "y1" | "x2" | "y2">): string {
  return `${label}:${Math.round(box.x1)}:${Math.round(box.y1)}:${Math.round(box.x2)}:${Math.round(box.y2)}`;
}

export function mergeDetections(local: Detection[], cloud: Detection[]): Detection[] {
  const merged: Detection[] = local.map((item) => ({ ...item }));

  for (const cloudItem of cloud) {
    let matched = false;

    for (let index = 0; index < merged.length; index += 1) {
      const existing = merged[index];
      if (iou(existing, cloudItem) >= IOU_THRESHOLD) {
        matched = true;
        merged[index] = {
          ...existing,
          label: cloudItem.label.length >= existing.label.length ? cloudItem.label : existing.label,
          source: "cloud",
          confidence: cloudItem.confidence ?? existing.confidence,
        };
        break;
      }
    }

    if (!matched) {
      merged.push({
        ...cloudItem,
        id: makeId(cloudItem.label, cloudItem),
        source: "cloud",
      });
    }
  }

  return merged;
}

export function toDetections(
  raw: Array<{
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    source?: Detection["source"];
    confidence?: number | null;
  }>,
  source: Detection["source"],
): Detection[] {
  return raw.map((item) => ({
    id: makeId(item.label, item),
    label: item.label,
    x1: item.x1,
    y1: item.y1,
    x2: item.x2,
    y2: item.y2,
    source: item.source ?? source,
    confidence: item.confidence ?? undefined,
  }));
}
