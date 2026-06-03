import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "@/components/ui/Button";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING, BORDER_RADIUS } from "@/utils/spacing";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMMSS(totalSeconds: number) {
  const t = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m.toString()}:${s.toString().padStart(2, "0")}`;
}

type Props = {
  focusMinutes: number;
  breakMinutes: number;
  onComplete?: () => void; // focus completion
};

export function PomodoroTimer({ focusMinutes, breakMinutes, onComplete }: Props) {
  const focusSeconds = Math.max(60, Math.floor(focusMinutes * 60));
  const breakSeconds = Math.max(60, Math.floor(breakMinutes * 60));

  const [phase, setPhase] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(focusSeconds);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const totalSeconds = phase === "focus" ? focusSeconds : breakSeconds;

  useEffect(() => {
    setRemainingSeconds(focusSeconds);
    setPhase("focus");
    setRunning(false);
    setSessionsCompleted(0);
    // reset progress
    progressAnim.setValue(0);
  }, [focusSeconds, breakSeconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          intervalRef.current = null;

          // switch phase
          if (phase === "focus") {
            setSessionsCompleted((c) => c + 1);
            onComplete?.();
            setPhase("break");
            setRemainingSeconds(breakSeconds);
            // auto start next phase if user left running
            return breakSeconds;
          }

          // break -> focus
          setPhase("focus");
          setRemainingSeconds(focusSeconds);
          return focusSeconds;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [running, phase, breakSeconds, focusSeconds, onComplete]);

  useEffect(() => {
    const ratio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;
    progressAnim.setValue(ratio);
  }, [remainingSeconds, totalSeconds, progressAnim]);

  const ratio = totalSeconds > 0 ? (totalSeconds - remainingSeconds) / totalSeconds : 0;

  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  const phaseLabel = phase === "focus" ? "Focus" : "Break";

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: phase === "focus" ? "rgba(99,102,241,0.18)" : "rgba(16,185,129,0.18)" },
          ]}
        >
          <Ionicons name={phase === "focus" ? "flame" : "leaf"} size={20} color={COLORS.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🍅 Pomodoro</Text>
          <Text style={styles.subTitle}>
            Mode: {phaseLabel} • Sessions: {sessionsCompleted}
          </Text>
        </View>
      </View>

      <View style={styles.timerRow}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Svg width={190} height={190}>
            <Circle cx={95} cy={95} r={radius} stroke="#E5E7EB" strokeWidth={10} fill="none" />
            <Circle
              cx={95}
              cy={95}
              r={radius}
              stroke={phase === "focus" ? COLORS.primary : "#10B981"}
              strokeWidth={10}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 95 95)"
            />
          </Svg>
          <View style={styles.timeCenter}>
            <Text style={styles.timeText}>{formatMMSS(remainingSeconds)}</Text>
          </View>
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
            setPhase("focus");
            setSessionsCompleted(0);
            setRemainingSeconds(focusSeconds);
          }}
        />
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
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: TEXT_COLORS.primary, fontSize: 16, fontWeight: "900" },
  subTitle: { color: TEXT_COLORS.secondary, fontWeight: "800", marginTop: 4 },
  timerRow: { alignItems: "center" },
  timeCenter: { position: "absolute", alignItems: "center", justifyContent: "center" },
  timeText: { fontSize: 26, fontWeight: "900", color: TEXT_COLORS.primary },
  controls: { flexDirection: "row", gap: SPACING.sm, justifyContent: "space-between", marginTop: SPACING.md },
});

