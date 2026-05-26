import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Card } from "@/components/ui/Card";
import { COLORS, TEXT_COLORS } from "@/utils/colors";
import { SPACING, BORDER_RADIUS } from "@/utils/spacing";
import { TYPOGRAPHY } from "@/utils/typography";
import { FileText, Trash2, Eye } from "lucide-react-native";

export interface PdfNoteItem {
  id: string;
  fileName: string;
  uploadDate: string;
  summary: string;
  importantPoints: string[];
  keywords: string[];
}

export function PdfCard({
  item,
  onViewDetails,
  onDelete,
  isBusy = false,
}: {
  item: PdfNoteItem;
  onViewDetails: () => void;
  onDelete: () => void;
  isBusy?: boolean;
}) {
  return (
    <Card style={styles.card} shadow="sm">
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <FileText size={22} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {item.fileName}
          </Text>
          <Text style={styles.dateText}>{new Date(item.uploadDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</Text>
        </View>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={onViewDetails}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          {isBusy ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Eye size={18} color={COLORS.primary} />}
          <Text style={styles.detailsText}>View</Text>
        </TouchableOpacity>
      </View>

      {!!item.summary && (
        <Text style={styles.summary} numberOfLines={4}>
          {item.summary}
        </Text>
      )}

      {!!item.keywords?.length && (
        <View style={styles.keywordRow}>
          {item.keywords.slice(0, 5).map((k) => (
            <View key={k} style={styles.keywordChip}>
              <Text style={styles.keywordText}>{k}</Text>
            </View>
          ))}
          {item.keywords.length > 5 && (
            <View style={styles.keywordChip}>
              <Text style={styles.keywordText}>+{item.keywords.length - 5}</Text>
            </View>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.deleteBtn]}
        onPress={onDelete}
        disabled={isBusy}
        activeOpacity={0.7}
      >
        <Trash2 size={16} color={COLORS.error} />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray100,
    backgroundColor: "rgba(255,255,255,0.93)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "rgba(99,102,241,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    fontWeight: "700",
    marginBottom: 2,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(79,70,229,0.35)",
    backgroundColor: "rgba(79,70,229,0.06)",
  },
  detailsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
  summary: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  keywordRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  keywordChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.35)",
    backgroundColor: "rgba(99,102,241,0.08)",
  },
  keywordText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "600",
  },
  deleteBtn: {
    marginTop: SPACING.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.25)",
  },
  deleteText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    fontWeight: "700",
  },
});

