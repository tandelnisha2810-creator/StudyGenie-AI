import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING } from "@/utils/spacing";

export function PlannerSectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons extends any ? any : string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Ionicons name={icon as any} size={18} color={COLORS.primary} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.sm },
  headerRow: { flexDirection: "row", gap: SPACING.sm, alignItems: "center", marginBottom: 4 },
  title: { color: TEXT_COLORS.primary, fontSize: 16, fontWeight: "900" },
  subtitle: { color: TEXT_COLORS.secondary, fontWeight: "700" },
});

