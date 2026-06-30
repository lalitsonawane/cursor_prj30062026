export type DetectionSource = "local" | "cloud";

export type Detection = {
  id: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  source: DetectionSource;
  confidence?: number;
};

export type ScanResponse = {
  image_width: number;
  image_height: number;
  inference_ms: number;
  categories_used: string[];
  detections: Array<{
    label: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    source?: DetectionSource;
    confidence?: number | null;
  }>;
  mock?: boolean;
};
