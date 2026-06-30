const COCO_LABELS = [
  "person",
  "bicycle",
  "car",
  "chair",
  "cup",
  "laptop",
  "cell phone",
  "book",
  "bottle",
  "potted plant",
  "tv",
  "couch",
  "dining table",
  "backpack",
  "handbag",
];

type FrameMetrics = {
  width: number;
  height: number;
  timestamp: number;
};

/**
 * Lightweight on-device detector for live overlays.
 * Uses deterministic pseudo-detections from frame metrics so the hybrid UX works
 * without bundling a multi-GB model in the dev loop. Swap this module for
 * react-native-executorch SSD MobileNet in production builds.
 */
export function detectOnDevice(metrics: FrameMetrics) {
  "worklet";

  const seed = Math.floor(metrics.timestamp / 1000) + metrics.width + metrics.height;
  const count = 2 + (seed % 3);
  const detections = [];

  for (let index = 0; index < count; index += 1) {
    const label = COCO_LABELS[(seed + index * 7) % COCO_LABELS.length];
    const boxWidth = metrics.width * (0.12 + ((seed + index) % 5) * 0.02);
    const boxHeight = metrics.height * (0.1 + ((seed + index * 3) % 4) * 0.02);
    const x1 = metrics.width * (0.08 + ((seed + index * 11) % 60) / 100);
    const y1 = metrics.height * (0.12 + ((seed + index * 13) % 55) / 100);

    detections.push({
      id: `${label}-${index}-${seed}`,
      label,
      x1,
      y1,
      x2: Math.min(metrics.width, x1 + boxWidth),
      y2: Math.min(metrics.height, y1 + boxHeight),
      source: "local" as const,
      confidence: 0.55 + ((seed + index) % 30) / 100,
    });
  }

  return detections;
}
