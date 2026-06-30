import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LiveCamera } from "../components/LiveCamera";

export default function LiveScreen() {
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [cloudEnabled, setCloudEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Surroundings Scanner</Text>
          <Text style={styles.subtitle}>Live hybrid detection</Text>
        </View>
        <Pressable style={styles.chip} onPress={() => setLiveEnabled((value) => !value)}>
          <Text style={styles.chipText}>{liveEnabled ? "Pause" : "Resume"}</Text>
        </Pressable>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Cloud enrichment</Text>
        <Switch value={cloudEnabled} onValueChange={setCloudEnabled} />
      </View>

      <View style={styles.cameraShell}>
        <LiveCamera liveEnabled={liveEnabled} cloudEnabled={cloudEnabled} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#020617",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#f8fafc",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 2,
  },
  chip: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: {
    color: "#f8fafc",
    fontWeight: "700",
  },
  toggleRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: {
    color: "#cbd5e1",
    fontSize: 15,
  },
  cameraShell: {
    flex: 1,
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
