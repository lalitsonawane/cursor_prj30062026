import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import {
  Camera,
  type CameraRef,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  usePhotoOutput,
} from "react-native-vision-camera";

import { DetectionOverlay } from "./DetectionOverlay";
import { config } from "../lib/config";
import { detectOnDevice } from "../lib/onDeviceDetector";
import { ScanOrchestrator } from "../lib/scanOrchestrator";
import type { Detection } from "../lib/types";

type Props = {
  liveEnabled: boolean;
  cloudEnabled: boolean;
};

function disposeHybrid(value: unknown) {
  const disposable = value as { dispose?: () => void };
  disposable.dispose?.();
}

export function LiveCamera({ liveEnabled, cloudEnabled }: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const photoOutput = usePhotoOutput();
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [detections, setDetections] = useState<Detection[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<"idle" | "scanning" | "error">("idle");
  const [cloudMessage, setCloudMessage] = useState<string | undefined>();
  const [frameSize, setFrameSize] = useState({ width: 1080, height: 1920 });
  const localDetectionsRef = useRef<Detection[]>([]);
  const liveEnabledShared = useSharedValue(liveEnabled);
  const frameCounter = useSharedValue(0);

  const orchestrator = useMemo(
    () =>
      new ScanOrchestrator({
        onDetections: setDetections,
        onCloudStatus: (status, message) => {
          setCloudStatus(status);
          setCloudMessage(message);
        },
        getLocalDetections: () => localDetectionsRef.current,
      }),
    [],
  );

  const publishLocalDetections = useCallback((next: Detection[]) => {
    localDetectionsRef.current = next;
    setDetections(next);
  }, []);

  useEffect(() => {
    liveEnabledShared.value = liveEnabled;
  }, [liveEnabled, liveEnabledShared]);

  const frameOutput = useFrameOutput({
    onFrame(frame) {
      "worklet";

      if (!liveEnabledShared.value) {
        disposeHybrid(frame);
        return;
      }

      frameCounter.value += 1;
      if (frameCounter.value % config.localProcessEveryNthFrame !== 0) {
        disposeHybrid(frame);
        return;
      }

      const next = detectOnDevice({
        width: frame.width,
        height: frame.height,
        timestamp: frame.timestamp,
      });

      runOnJS(setFrameSize)({ width: frame.width, height: frame.height });
      runOnJS(publishLocalDetections)(next);
      disposeHybrid(frame);
    },
  });

  const captureKeyframe = useCallback(async () => {
    if (!photoOutput) {
      return null;
    }

    const photo = await photoOutput.capturePhoto({}, {});
    const uri = await photo.saveToTemporaryFileAsync();
    disposeHybrid(photo);
    return { uri };
  }, [photoOutput]);

  useEffect(() => {
    orchestrator.setEnabled(liveEnabled);
    orchestrator.setCloudEnabled(cloudEnabled);

    if (liveEnabled && cloudEnabled) {
      orchestrator.start(captureKeyframe);
    } else {
      orchestrator.stop();
    }

    return () => orchestrator.stop();
  }, [captureKeyframe, cloudEnabled, liveEnabled, orchestrator]);

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>No camera device found.</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Camera permission is required for live scanning.</Text>
        <Pressable style={styles.button} onPress={() => void requestPermission()}>
          <Text style={styles.buttonText}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={liveEnabled}
        outputs={[frameOutput, photoOutput]}
      />

      <DetectionOverlay
        detections={detections}
        imageWidth={frameSize.width}
        imageHeight={frameSize.height}
        viewWidth={layout.width}
        viewHeight={layout.height}
        highlightedId={highlightedId}
        onSelect={setHighlightedId}
      />

      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          {cloudEnabled
            ? cloudStatus === "scanning"
              ? "Enhancing with cloud AI…"
              : cloudStatus === "error"
                ? cloudMessage ?? "Cloud enhancement unavailable"
                : "Live scan active"
            : "On-device only"}
        </Text>
      </View>

      <View style={styles.listPanel}>
        <Text style={styles.listTitle}>Detected items</Text>
        {detections.length === 0 ? (
          <Text style={styles.listEmpty}>Point the camera at your surroundings.</Text>
        ) : (
          detections.slice(0, 8).map((item) => (
            <Pressable key={item.id} onPress={() => setHighlightedId(item.id)} style={styles.listItem}>
              <View style={[styles.dot, item.source === "cloud" ? styles.cloudDot : styles.localDot]} />
              <Text style={styles.listLabel}>{item.label}</Text>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#020617",
  },
  message: {
    color: "#e2e8f0",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#38bdf8",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  statusBar: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusText: {
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: "600",
  },
  listPanel: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: "rgba(15,23,42,0.88)",
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  listTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  listEmpty: {
    color: "#94a3b8",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  localDot: {
    backgroundColor: "#ffffff",
  },
  cloudDot: {
    backgroundColor: "#38bdf8",
  },
  listLabel: {
    color: "#e2e8f0",
    fontSize: 14,
  },
});
