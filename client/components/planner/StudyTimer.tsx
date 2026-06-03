import React, { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING, BORDER_RADIUS } from "@/utils/spacing";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatHMS(totalSeconds: number) {
  const t = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  return {
    h: h.toString(),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
  };
}

type Props = {
  initialDurationSeconds: number;
  onComplete?: () => void;
};

export function StudyTimer({ initialDurationSeconds, onComplete }: Props) {
  const [durationSeconds, setDurationSeconds] = useState(initialDurationSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialDurationSeconds);
  const [running, setRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDurationSeconds(initialDurationSeconds);
    setRemainingSeconds(initialDurationSeconds);
    setRunning(false);
  }, [initialDurationSeconds]);

  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          // complete
          setRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, onComplete]);

  const parts = useMemo(() => formatHMS(remainingSeconds), [remainingSeconds]);

  const [durationMinutesInput, setDurationMinutesInput] = useState(
    Math.max(1, Math.round(initialDurationSeconds / 60)).toString(),
  );

  useEffect(() => {
    setDurationMinutesInput(Math.max(1, Math.round(initialDurationSeconds / 60)).toString());
  }, [initialDurationSeconds]);

  const applyDuration = () => {
    const minutes = Number(durationMinutesInput);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    const seconds = clamp(Math.floor(minutes * 60), 60, 8 * 3600);
    setDurationSeconds(seconds);
    setRemainingSeconds(seconds);
    setRunning(false);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="timer" size={20} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Study Timer</Text>
      </View>

      <View style={styles.timeGrid}>
        <View style={styles.timeCell}>
          <Text style={styles.timeNum}>{parts.h}</Text>
          <Text style={styles.timeLabel}>H</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.timeCell}>
          <Text style={styles.timeNum}>{parts.m}</Text>
          <Text style={styles.timeLabel}>M</Text>
        </View>
        <View style={styles.sep} />
        <View style={styles.timeCell}>
          <Text style={styles.timeNum}>{parts.s}</Text>
          <Text style={styles.timeLabel}>S</Text>
        </View>
      </View>

      <View style={styles.controls}>
        {!running ? (
          <Button title="Start" onPress={() => setRunning(true)} />
        ) : (
          <Button title="Pause" variant="outline" onPress={() => setRunning(false)} />
        )}
        <Button
          title="Reset"
          variant="outline"
          onPress={() => {
            setRunning(false);
            setRemainingSeconds(durationSeconds);
          }}
        />
      </View>

      <View style={styles.durationWrap}>
        <Text style={styles.subTitle}>Custom duration</Text>
        <View style={{ flexDirection: "row", gap: SPACING.sm, alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Input
              value={durationMinutesInput}
              onChangeText={setDurationMinutesInput}
              placeholder="Minutes"
              keyboardType="numeric"
            />
          </View>
          <Button title="Apply" onPress={applyDuration} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    padding: SPACING.lg,
    shadowColor: COLORS.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    marginBottom: SPACING.md,
  },
  headerRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "center", marginBottom: SPACING.md },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: TEXT_COLORS.primary, fontSize: 16, fontWeight: "900" },
  timeGrid: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.md,
  },
  timeCell: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.gray50,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    minWidth: 78,
  },
  timeNum: { fontSize: 24, fontWeight: "900", color: TEXT_COLORS.primary },
  timeLabel: { fontSize: 12, fontWeight: "700", color: TEXT_COLORS.secondary, marginTop: 2 },
  sep: { width: 8 },
  controls: { flexDirection: "row", gap: SPACING.sm, justifyContent: "space-between" },
  durationWrap: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.gray100 },
  subTitle: { color: TEXT_COLORS.secondary, fontWeight: "800", marginBottom: SPACING.sm },
});

