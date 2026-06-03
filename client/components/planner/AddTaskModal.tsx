import React, { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BORDER_RADIUS, SPACING } from "@/utils/spacing";
import { COLORS, TEXT_COLORS } from "@/utils/colors";

type Draft = {
  title: string;
  subject?: string;
  dueTime?: string; // HH:mm
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (draft: Draft) => void;
  initial?: Draft;
};

export function AddTaskModal({ visible, onClose, onSubmit, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? "");

  useEffect(() => {
    if (visible) {
      setTitle(initial?.title ?? "");
      setSubject(initial?.subject ?? "");
      setDueTime(initial?.dueTime ?? "");
    }
  }, [visible, initial]);

  const canSubmit = title.trim().length > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalWrap}>
          <LinearGradient colors={[COLORS.gradientStart, COLORS.gradientEnd]} style={styles.gradient}>
            <Text style={styles.title}>Add Daily Task</Text>
            <View style={styles.form}>
              <Input
                placeholder="Task title"
                value={title}
                onChangeText={setTitle}
                containerStyle={styles.input}
              />
              <Input
                placeholder="Subject (optional)"
                value={subject}
                onChangeText={setSubject}
                containerStyle={styles.input}
              />
              <Input
                placeholder="Due time (HH:mm) (optional)"
                value={dueTime}
                onChangeText={setDueTime}
                containerStyle={styles.input}
              />

              <View style={styles.actions}>
                <Button title="Cancel" onPress={onClose} variant="outline" style={{ flex: 1 }} />
                <Button
                  title="Add"
                  onPress={() => {
                    if (!canSubmit) return;
                    onSubmit({
                      title: title.trim(),
                      subject: subject.trim() ? subject.trim() : undefined,
                      dueTime: dueTime.trim() ? dueTime.trim() : undefined,
                    });
                  }}
                  disabled={!canSubmit}
                  style={{ flex: 1, marginLeft: SPACING.sm }}
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

