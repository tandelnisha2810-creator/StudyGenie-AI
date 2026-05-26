/**
 * NoteCard Component
 * Displays a single note with quick actions for pin, favorite, summarize and delete.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { COLORS, TEXT_COLORS } from "../utils/colors";
import { SPACING, BORDER_RADIUS, SHADOW } from "../utils/spacing";
import { TYPOGRAPHY } from "../utils/typography";
import {
  Pin,
  Star,
  Sparkles,
  Trash2,
  Edit2,
  MessageCircle,
} from "lucide-react-native";

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  subject: string;
  tags: string[];
  color?: string;
  image?: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

interface NoteCardProps {
  note: NoteItem;
  onPress: () => void;
  onTogglePin: () => Promise<void> | void;
  onToggleFavorite: () => Promise<void> | void;
  onSummarize: () => Promise<void> | void;
  // onDelete(noteId, mongoId) to guarantee correct id handling
  onDelete: (noteId?: string, mongoId?: string) => Promise<void> | void;
  isBusy?: boolean;
}


// Get color background based on note color
const getNoteColorBg = (color?: string): string => {
  const colorMap: { [key: string]: string } = {
    yellow: "#FEF3C7",
    blue: "#DBEAFE",
    green: "#DCFCE7",
    pink: "#FBCFE8",
    purple: "#E9D5FF",
  };
  return colorMap[color || "yellow"] || "#FEF3C7";
};

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onPress,
  onTogglePin,
  onToggleFavorite,
  onSummarize,
  onDelete,
  isBusy = false,
}) => {

  const formattedDate = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const previewText = note.summary || note.content;
  const cardBgColor = getNoteColorBg(note.color);

  return (
    <Card
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBgColor }]}
      shadow="sm"
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {note.title}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>{note.subject}</Text>
            </View>
            <Text style={styles.meta}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.quickIcons}>
          <TouchableOpacity
            onPress={onToggleFavorite}
            style={styles.iconButton}
            disabled={isBusy}
            activeOpacity={0.7}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={COLORS.warning} />
            ) : (
              <Star
                size={18}
                color={note.isFavorite ? COLORS.warning : COLORS.gray500}
                fill={note.isFavorite ? COLORS.warning : "transparent"}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onTogglePin}
            style={styles.iconButton}
            disabled={isBusy}
            activeOpacity={0.7}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Pin
                size={18}
                color={note.isPinned ? COLORS.primary : COLORS.gray500}
                fill={note.isPinned ? COLORS.primary : "transparent"}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview Text */}
      <Text style={styles.preview} numberOfLines={4}>
        {previewText}
      </Text>

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagRow}>
          {note.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {note.tags.length > 3 && (
            <View style={styles.tagChip}>
              <Text style={styles.tagText}>+{note.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={onPress}
          style={styles.actionButton}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Edit2 size={16} color={COLORS.primary} />
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onSummarize}
          style={styles.actionButton}
          disabled={isBusy}
          activeOpacity={0.7}
        >
          <Sparkles size={16} color={COLORS.secondary} />
          <Text style={styles.actionLabel}>Summarize</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onDelete(note.id, (note as any)._id)}
          style={[styles.actionButton, styles.deleteButton, { zIndex: 2 }]}
          disabled={isBusy}
          activeOpacity={0.7}
        >

          <Trash2 size={16} color={COLORS.error} />
          <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 260,
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    borderColor: COLORS.gray100,
    borderWidth: 1,
    padding: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  headerText: {
    flex: 1,
    marginRight: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.bodyMedium,
    color: TEXT_COLORS.primary,
    marginBottom: SPACING.xs,
    fontWeight: "600",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  subjectBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  subjectBadgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "600",
    fontSize: 11,
  },
  meta: {
    ...TYPOGRAPHY.caption,
    color: TEXT_COLORS.secondary,
    fontSize: 12,
  },
  quickIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  iconButton: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  preview: {
    ...TYPOGRAPHY.bodySmall,
    color: TEXT_COLORS.secondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tagChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: "rgba(59, 130, 246, 0.15)",
    borderWidth: 0.5,
    borderColor: COLORS.primary,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.08)",
  },
  actionButton: {
    flex: 1,
    minWidth: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: "rgba(59, 130, 246, 0.08)",
    gap: SPACING.xs,
  },
  actionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "500",
    fontSize: 12,
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  deleteLabel: {
    color: COLORS.error,
  },
});

export default NoteCard;

