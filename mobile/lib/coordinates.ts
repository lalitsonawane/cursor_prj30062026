import type { Detection } from "./types";

type Box = Pick<Detection, "x1" | "y1" | "x2" | "y2">;

export function mapDetectionToView(
  detection: Detection,
  imageWidth: number,
  imageHeight: number,
  viewWidth: number,
  viewHeight: number,
): Detection {
  const scale = Math.max(viewWidth / imageWidth, viewHeight / imageHeight);
  const renderedWidth = imageWidth * scale;
  const renderedHeight = imageHeight * scale;
  const offsetX = (viewWidth - renderedWidth) / 2;
  const offsetY = (viewHeight - renderedHeight) / 2;

  return {
    ...detection,
    x1: detection.x1 * scale + offsetX,
    y1: detection.y1 * scale + offsetY,
    x2: detection.x2 * scale + offsetX,
    y2: detection.y2 * scale + offsetY,
  };
}

export function iou(a: Box, b: Box): number {
  const xLeft = Math.max(a.x1, b.x1);
  const yTop = Math.max(a.y1, b.y1);
  const xRight = Math.min(a.x2, b.x2);
  const yBottom = Math.min(a.y2, b.y2);

  if (xRight <= xLeft || yBottom <= yTop) {
    return 0;
  }

  const intersection = (xRight - xLeft) * (yBottom - yTop);
  const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
  const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
  const union = areaA + areaB - intersection;
  return union > 0 ? intersection / union : 0;
}
