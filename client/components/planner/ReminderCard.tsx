import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PlannerExamReminder } from "@/services/plannerService";
import { BORDER_RADIUS, SPACING } from "@/utils/spacing";
import { COLORS } from "@/utils/colors";

export function ReminderCard({
  reminder,
  onEdit,
  onDelete,
}: {
  reminder: PlannerExamReminder;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <LinearGradient
      colors={["#8B5CF6", "#6366F1"]}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Ionicons name="calendar" size={18} color={COLORS.white} />
            <Text style={styles.title} numberOfLines={1}>
              {reminder.examTitle}
            </Text>
          </View>
          {reminder.subject ? <Text style={styles.meta}>{reminder.subject}</Text> : null}
          <Text style={styles.meta}>📅 {reminder.examDate}</Text>
          <Text style={styles.meta}>⏰ {reminder.examTime}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={styles.iconBtn} accessibilityRole="button">
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.iconBtn} accessibilityRole="button">
            <Ionicons name="trash-outline" size={18} color={COLORS.white} />
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  row: { flexDirection: "row", gap: SPACING.md, alignItems: "flex-start" },
  content: { flex: 1 },
  topRow: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 6 },
  title: { color: COLORS.white, fontWeight: "900", fontSize: 16, flex: 1 },
  meta: { color: COLORS.white, opacity: 0.92, fontSize: 12, fontWeight: "700", marginTop: 2 },
  actions: { gap: SPACING.sm },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 9999,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});

