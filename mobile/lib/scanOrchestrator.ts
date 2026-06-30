import * as ImageManipulator from "expo-image-manipulator";

import { scanImageUri } from "./api";
import { config } from "./config";
import { mergeDetections, toDetections } from "./mergeDetections";
import type { Detection } from "./types";

type ScanOrchestratorOptions = {
  onDetections: (detections: Detection[]) => void;
  onCloudStatus: (status: "idle" | "scanning" | "error", message?: string) => void;
  getLocalDetections: () => Detection[];
};

export class ScanOrchestrator {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private inFlight = false;
  private lastScanAt = 0;
  private enabled = true;
  private cloudEnabled = true;

  constructor(private readonly options: ScanOrchestratorOptions) {}

  start(capture: () => Promise<{ uri: string } | null>) {
    this.stop();
    this.intervalId = setInterval(() => {
      void this.maybeScan(capture);
    }, config.cloudScanIntervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  setCloudEnabled(enabled: boolean) {
    this.cloudEnabled = enabled;
  }

  private async maybeScan(capture: () => Promise<{ uri: string } | null>) {
    if (!this.enabled || !this.cloudEnabled || this.inFlight) {
      return;
    }

    const now = Date.now();
    if (now - this.lastScanAt < config.minCloudScanIntervalMs) {
      return;
    }

    this.inFlight = true;
    this.lastScanAt = now;
    this.options.onCloudStatus("scanning");

    try {
      const captured = await capture();
      if (!captured) {
        return;
      }

      const compressed = await ImageManipulator.manipulateAsync(
        captured.uri,
        [{ resize: { width: config.cloudUploadMaxEdge } }],
        {
          compress: config.cloudUploadQuality,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );

      const response = await scanImageUri(compressed.uri);
      const cloudDetections = toDetections(response.detections, "cloud");
      const merged = mergeDetections(this.options.getLocalDetections(), cloudDetections);
      this.options.onDetections(merged);
      this.options.onCloudStatus("idle");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Cloud scan failed";
      this.options.onCloudStatus("error", message);
    } finally {
      this.inFlight = false;
    }
  }
}
