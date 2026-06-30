import { Pressable, StyleSheet, Text, View } from "react-native";

import { mapDetectionToView } from "../lib/coordinates";
import type { Detection } from "../lib/types";

type Props = {
  detections: Detection[];
  imageWidth: number;
  imageHeight: number;
  viewWidth: number;
  viewHeight: number;
  highlightedId?: string | null;
  onSelect?: (id: string) => void;
};

export function DetectionOverlay({
  detections,
  imageWidth,
  imageHeight,
  viewWidth,
  viewHeight,
  highlightedId,
  onSelect,
}: Props) {
  if (viewWidth <= 0 || viewHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {detections.map((detection) => {
        const mapped = mapDetectionToView(
          detection,
          imageWidth,
          imageHeight,
          viewWidth,
          viewHeight,
        );
        const width = Math.max(1, mapped.x2 - mapped.x1);
        const height = Math.max(1, mapped.y2 - mapped.y1);
        const isHighlighted = highlightedId === detection.id;
        const isCloud = detection.source === "cloud";

        return (
          <Pressable
            key={detection.id}
            onPress={() => onSelect?.(detection.id)}
            style={[
              styles.box,
              {
                left: mapped.x1,
                top: mapped.y1,
                width,
                height,
                borderColor: isCloud ? "#38bdf8" : "#ffffff",
                backgroundColor: isHighlighted ? "rgba(56, 189, 248, 0.18)" : "rgba(15, 23, 42, 0.08)",
              },
            ]}
          >
            <View style={[styles.label, isCloud ? styles.cloudLabel : styles.localLabel]}>
              <Text style={styles.labelText}>{detection.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    borderWidth: 2,
    borderRadius: 8,
  },
  label: {
    position: "absolute",
    top: -24,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  localLabel: {
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  cloudLabel: {
    backgroundColor: "rgba(56,189,248,0.92)",
  },
  labelText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "700",
  },
});
