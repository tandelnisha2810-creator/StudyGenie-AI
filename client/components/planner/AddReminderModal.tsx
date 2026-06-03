import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BORDER_RADIUS, SPACING } from "@/utils/spacing";
import { COLORS } from "@/utils/colors";

type Draft = {
  examTitle: string;
  subject?: string;
  examDate: string; // YYYY-MM-DD
  examTime: string; // HH:mm
  notificationMinutesBefore?: number[];
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: Draft) => void;
  initial?: Draft;
};

export function AddReminderModal({ visible, onClose, onSubmit, initial }: Props) {
  const [examTitle, setExamTitle] = useState(initial?.examTitle ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [examDate, setExamDate] = useState(initial?.examDate ?? "");
  const [examTime, setExamTime] = useState(initial?.examTime ?? "");
  const [minutesBefore, setMinutesBefore] = useState(
    initial?.notificationMinutesBefore?.join(",") ?? "60,15",
  );

  useEffect(() => {
    if (!visible) return;
    setExamTitle(initial?.examTitle ?? "");
    setSubject(initial?.subject ?? "");
    setExamDate(initial?.examDate ?? "");
    setExamTime(initial?.examTime ?? "");
    setMinutesBefore(initial?.notificationMinutesBefore?.join(",") ?? "60,15");
  }, [visible, initial]);

  const canSubmit = examTitle.trim().length > 0 && examDate.trim().length > 0 && examTime.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalWrap}>
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.gradient}>
            <Text style={styles.title}>Add Exam Reminder</Text>
            <View style={styles.form}>
              <Input placeholder="Exam title" value={examTitle} onChangeText={setExamTitle} containerStyle={styles.input} />
              <Input placeholder="Subject (optional)" value={subject} onChangeText={setSubject} containerStyle={styles.input} />
              <Input placeholder="Exam date (YYYY-MM-DD)" value={examDate} onChangeText={setExamDate} containerStyle={styles.input} />
              <Input placeholder="Exam time (HH:mm)" value={examTime} onChangeText={setExamTime} containerStyle={styles.input} />
              <Input
                placeholder="Remind minutes before (comma-separated) e.g. 60,15"
                value={minutesBefore}
                onChangeText={setMinutesBefore}
                containerStyle={styles.input}
              />

              <View style={styles.actions}>
                <Button title="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
                <Button
                  title="Add"
                  disabled={!canSubmit}
                  style={{ flex: 1, marginLeft: SPACING.sm }}
                  onPress={() => {
                    if (!canSubmit) return;
                    const parts = minutesBefore
                      .split(",")
                      .map((s) => Number(s.trim()))
                      .filter((n) => Number.isFinite(n) && n >= 0);

                    onSubmit({
                      examTitle: examTitle.trim(),
                      subject: subject.trim() ? subject.trim() : undefined,
                      examDate: examDate.trim(),
                      examTime: examTime.trim(),
                      notificationMinutesBefore: parts.length ? parts : undefined,
                    });
                  }}
                />
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  modalWrap: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: "hidden",
  },
  gradient: {
    padding: SPACING.lg,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: SPACING.md,
  },
  form: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  input: {
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: "row",
    marginTop: SPACING.md,
  },
});

