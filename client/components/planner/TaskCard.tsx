import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { PlannerTask } from "@/services/plannerService";
import { BORDER_RADIUS, SPACING } from "@/utils/spacing";
import { COLORS, TEXT_COLORS } from "@/utils/colors";

export function TaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: PlannerTask;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {

  return (
    <LinearGradient
      colors={task.completed ? ["#10B981", "#34D399"] : [COLORS.gradientStart, COLORS.gradientEnd]}
      style={styles.wrap}
    >
      <View style={styles.row}>
        <Pressable onPress={onToggle} style={styles.checkbox} accessibilityRole="button">
          <Ionicons name={task.completed ? "checkbox" : "square-outline"} size={22} color={COLORS.white} />
        </Pressable>

        <View style={styles.content}>
          <Text style={[styles.title, task.completed && styles.titleDone]} numberOfLines={2}>
            {task.title}
          </Text>
          {task.subject ? (
            <Text style={styles.meta} numberOfLines={1}>
              {task.subject}
            </Text>
          ) : null}
          {task.dueTime ? (
            <Text style={styles.meta}>Due: {task.dueTime}</Text>
          ) : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              console.log("Edit clicked", task);
              onEdit();
            }}
            style={styles.iconBtn}
            accessibilityRole="button"
          >
            <Ionicons name="create-outline" size={18} color={COLORS.white} />
          </Pressable>
          <Pressable
            onPress={() => {
              console.log("Delete clicked", task.id);
              onDelete();
            }}
            style={styles.deleteBtn}
            accessibilityRole="button"
          >
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
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
  },
  checkbox: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  title: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  titleDone: {
    opacity: 0.95,
    textDecorationLine: "line-through",
  },
  meta: {
    color: TEXT_COLORS.white,
    opacity: 0.9,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  actions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 9999,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    width: 34,

    height: 34,
    borderRadius: 9999,
    backgroundColor: "rgba(0,0,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
});


